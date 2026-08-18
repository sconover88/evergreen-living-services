import {
  TranscribeStreamingClient,
  StartMedicalStreamTranscriptionCommand,
} from '@aws-sdk/client-transcribe-streaming';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';

const TARGET_SAMPLE_RATE = 16000;
const SCRIPT_PROCESSOR_BUFFER_SIZE = 2048;

export type TranscriptCallback = (text: string, isFinal: boolean) => void;

export interface TranscriptionSession {
  stop: () => void;
}

function float32ToPcm16(input: Float32Array): Uint8Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return new Uint8Array(output.buffer);
}

// Linear downsampling — needed when browser ignores our 16kHz sampleRate hint
function downsample(buffer: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return buffer;
  const ratio = fromRate / toRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.ceil((i + 1) * ratio), buffer.length);
    let sum = 0;
    for (let j = start; j < end; j++) sum += buffer[j];
    result[i] = sum / (end - start);
  }
  return result;
}

async function* audioStreamGenerator(
  queue: Uint8Array[],
  stopped: { value: boolean }
): AsyncGenerator<{ AudioEvent: { AudioChunk: Uint8Array } }> {
  while (!stopped.value || queue.length > 0) {
    if (queue.length > 0) {
      yield { AudioEvent: { AudioChunk: queue.shift()! } };
    } else {
      await new Promise<void>((resolve) => setTimeout(resolve, 20));
    }
  }
}

export function hasPoolConfig(): boolean {
  return !!import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID;
}

export async function startMedicalTranscription(
  onTranscript: TranscriptCallback,
  onError: (err: Error) => void
): Promise<TranscriptionSession> {
  const region = import.meta.env.VITE_AWS_REGION ?? 'us-east-1';
  const identityPoolId = import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID;

  if (!identityPoolId) {
    throw new Error(
      'Cognito Identity Pool not configured. Add VITE_COGNITO_IDENTITY_POOL_ID to .env'
    );
  }

  const micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

  // Request 16kHz — browser may grant a different rate, so we track actual rate for downsampling
  const audioContext = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE });
  const actualRate = audioContext.sampleRate;

  const source = audioContext.createMediaStreamSource(micStream);
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const processor = audioContext.createScriptProcessor(SCRIPT_PROCESSOR_BUFFER_SIZE, 1, 1);

  // Muted gain node — ScriptProcessorNode must be connected to destination to fire
  const silencer = audioContext.createGain();
  silencer.gain.value = 0;
  source.connect(processor);
  processor.connect(silencer);
  silencer.connect(audioContext.destination);

  const queue: Uint8Array[] = [];
  const stopped = { value: false };

  processor.onaudioprocess = ({ inputBuffer }) => {
    if (stopped.value) return;
    const raw = inputBuffer.getChannelData(0);
    const resampled = downsample(raw, actualRate, TARGET_SAMPLE_RATE);
    queue.push(float32ToPcm16(resampled));
  };

  const client = new TranscribeStreamingClient({
    region,
    credentials: fromCognitoIdentityPool({
      clientConfig: { region },
      identityPoolId,
    }),
  });

  const command = new StartMedicalStreamTranscriptionCommand({
    LanguageCode: 'en-US',
    MediaEncoding: 'pcm',
    MediaSampleRateHertz: TARGET_SAMPLE_RATE,
    Specialty: 'PRIMARYCARE',
    Type: 'DICTATION',
    AudioStream: audioStreamGenerator(queue, stopped),
  });

  // Run the streaming loop in the background — errors surface via onError
  void (async () => {
    try {
      const response = await client.send(command);
      for await (const event of response.TranscriptResultStream ?? []) {
        if (stopped.value) break;
        const results = event.TranscriptEvent?.Transcript?.Results ?? [];
        for (const result of results) {
          const text = result.Alternatives?.[0]?.Transcript ?? '';
          if (text) onTranscript(text, !result.IsPartial);
        }
      }
    } catch (err) {
      if (!stopped.value) {
        onError(err instanceof Error ? err : new Error(String(err)));
      }
    }
  })();

  return {
    stop() {
      stopped.value = true;
      try {
        processor.disconnect();
        source.disconnect();
        silencer.disconnect();
      } catch {
        // already disconnected — safe to ignore
      }
      micStream.getTracks().forEach((t) => t.stop());
      void audioContext.close();
    },
  };
}
