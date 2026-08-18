import { useState, useRef, useCallback, useEffect, type KeyboardEvent } from 'react';
import { Mic, MicOff, Send } from 'lucide-react';
import {
  startMedicalTranscription,
  hasPoolConfig,
  type TranscriptionSession,
} from '@/services/transcribeService';

interface ConversationInputProps {
  onSubmit: (text: string) => void;
  disabled: boolean;
  placeholder?: string;
  /** If provided, clicking the textarea when empty triggers a character-by-character simulation. */
  simulatedText?: string | null;
  /** Called when the simulation has been consumed (finished typing or started). */
  onSimulationUsed?: () => void;
}

export function ConversationInput({
  onSubmit,
  disabled,
  placeholder = 'Type your observations here...',
  simulatedText = null,
  onSimulationUsed,
}: ConversationInputProps) {
  const [value, setValue] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isAwsRecording, setIsAwsRecording] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const simIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const simCharIndexRef = useRef(0);
  const simActiveRef = useRef(false);
  const awsSessionRef = useRef<TranscriptionSession | null>(null);
  const committedTextRef = useRef('');   // finalized AWS transcripts accumulated so far

  const isRecording = isSimulating || isAwsRecording;
  const trimmed = value.trim();
  const isSubmitDisabled = disabled || trimmed.length === 0 || isSimulating;
  const awsAvailable = hasPoolConfig();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simIntervalRef.current) clearTimeout(simIntervalRef.current);
      awsSessionRef.current?.stop();
    };
  }, []);

  // ── Simulated transcription (existing behaviour) ──────────────────────────

  const getCharDelay = (char: string): number => {
    if (char === '.') return 300;
    if (char === ',') return 150;
    if (char === ' ') return 70;
    return 50;
  };

  const startSimulation = useCallback(() => {
    if (!simulatedText || simActiveRef.current) return;
    simActiveRef.current = true;
    setIsSimulating(true);
    simCharIndexRef.current = 0;

    const typeNextChar = () => {
      if (simCharIndexRef.current >= simulatedText.length) {
        setIsSimulating(false);
        simActiveRef.current = false;
        simIntervalRef.current = null;
        onSimulationUsed?.();
        return;
      }
      const ch = simulatedText[simCharIndexRef.current++];
      setValue(simulatedText.slice(0, simCharIndexRef.current));
      simIntervalRef.current = setTimeout(typeNextChar, getCharDelay(ch));
    };

    simIntervalRef.current = setTimeout(typeNextChar, 200);
  }, [simulatedText, onSimulationUsed]);

  const handleClick = useCallback(() => {
    if (simulatedText && value === '' && !isRecording && !disabled && !isAwsRecording) {
      startSimulation();
    }
  }, [simulatedText, value, isRecording, isAwsRecording, disabled, startSimulation]);

  // ── AWS Transcribe Medical ────────────────────────────────────────────────

  const handleTranscript = useCallback((text: string, isFinal: boolean) => {
    if (isFinal) {
      committedTextRef.current = committedTextRef.current
        ? committedTextRef.current + ' ' + text
        : text;
      setValue(committedTextRef.current);
    } else {
      setValue(
        committedTextRef.current
          ? committedTextRef.current + ' ' + text
          : text
      );
    }
  }, []);

  const handleTranscribeError = useCallback((err: Error) => {
    setTranscribeError(err.message);
    setIsAwsRecording(false);
    awsSessionRef.current = null;
    committedTextRef.current = '';
  }, []);

  const toggleAwsRecording = useCallback(async () => {
    setTranscribeError(null);

    if (isAwsRecording) {
      awsSessionRef.current?.stop();
      awsSessionRef.current = null;
      committedTextRef.current = '';
      setIsAwsRecording(false);
      return;
    }

    // Preserve any text already in the textarea as a prefix
    committedTextRef.current = trimmed ? trimmed + ' ' : '';

    try {
      const session = await startMedicalTranscription(handleTranscript, handleTranscribeError);
      awsSessionRef.current = session;
      setIsAwsRecording(true);
    } catch (err) {
      setTranscribeError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  }, [isAwsRecording, trimmed, handleTranscript, handleTranscribeError]);

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(() => {
    if (isSubmitDisabled) return;

    // Stop AWS recording before submitting if still active
    if (isAwsRecording) {
      awsSessionRef.current?.stop();
      awsSessionRef.current = null;
      committedTextRef.current = '';
      setIsAwsRecording(false);
    }

    onSubmit(trimmed);
    setValue('');
    textareaRef.current?.focus();
  }, [isSubmitDisabled, isAwsRecording, onSubmit, trimmed]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const micButtonTitle = !awsAvailable
    ? 'AWS credentials not configured — add VITE_AWS_ACCESS_KEY_ID and VITE_AWS_SECRET_ACCESS_KEY to .env'
    : isAwsRecording
      ? 'Stop recording'
      : 'Start voice recording (AWS Transcribe Medical)';

  return (
    <div className="w-full" role="form" aria-label="Observation input">
      {/* Label */}
      <label htmlFor="conversation-input" className="block text-sm font-medium text-slate-600 mb-2">
        <span className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-indigo-500" aria-hidden="true" />
          Share your observations...
          {awsAvailable && (
            <span className="ml-auto text-xs font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              AWS Transcribe Medical
            </span>
          )}
        </span>
      </label>

      {/* Recording / Transcribing indicator */}
      {isRecording && (
        <div
          className="flex items-center gap-2 mb-2"
          role="status"
          aria-live="polite"
          aria-label={isAwsRecording ? 'AWS voice recording active' : 'Simulated transcription in progress'}
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
          <span className="text-xs text-slate-500">
            {isAwsRecording ? 'Listening via AWS Transcribe Medical...' : 'Transcribing...'}
          </span>
        </div>
      )}

      {/* Error banner */}
      {transcribeError && (
        <div
          className="flex items-start gap-2 mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700"
          role="alert"
        >
          <span className="font-medium">Transcription error:</span>
          <span>{transcribeError}</span>
        </div>
      )}

      {/* Input container */}
      <div
        className={[
          'relative flex items-end gap-2 sm:gap-3 border rounded-lg p-3 sm:p-4',
          'bg-white transition-all duration-150',
          disabled
            ? 'border-slate-100 bg-slate-50'
            : 'border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-1 focus-within:border-indigo-500',
        ].join(' ')}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          id="conversation-input"
          value={value}
          onChange={(e) => {
            const newVal = e.target.value;
            // Abort simulation if user types something different
            if (simActiveRef.current && simulatedText) {
              const expected = simulatedText.slice(0, simCharIndexRef.current);
              if (newVal !== expected && newVal !== simulatedText.slice(0, simCharIndexRef.current + 1)) {
                if (simIntervalRef.current) { clearTimeout(simIntervalRef.current); simIntervalRef.current = null; }
                setIsSimulating(false);
                simActiveRef.current = false;
              }
            }
            setValue(newVal);
          }}
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          disabled={disabled}
          placeholder={placeholder}
          rows={2}
          aria-label="Enter your nursing observations"
          aria-disabled={disabled}
          className={[
            'flex-1 resize-none bg-transparent text-slate-900 placeholder-slate-400',
            'text-sm sm:text-base leading-relaxed outline-none',
            'min-h-[52px] sm:min-h-[72px]',
            'focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:rounded-md',
            disabled ? 'cursor-not-allowed opacity-60' : '',
          ].join(' ')}
        />

        {/* AWS Mic button */}
        <button
          type="button"
          onClick={() => void toggleAwsRecording()}
          disabled={disabled || isSimulating || !awsAvailable}
          title={micButtonTitle}
          aria-label={micButtonTitle}
          aria-pressed={isAwsRecording}
          className={[
            'flex-shrink-0 flex items-center justify-center',
            'min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg',
            'transition-all duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
            !awsAvailable || disabled || isSimulating
              ? 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-50'
              : isAwsRecording
                ? 'bg-red-500 text-white shadow-[0_4px_14px_0_rgba(239,68,68,0.4)] hover:bg-red-600 animate-pulse'
                : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600',
          ].join(' ')}
        >
          {isAwsRecording ? (
            <MicOff className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Mic className="w-5 h-5" aria-hidden="true" />
          )}
        </button>

        {/* Submit button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          aria-label="Submit observation"
          className={[
            'flex-shrink-0 flex items-center justify-center',
            'min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg',
            'transition-all duration-150',
            isSubmitDisabled
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.3)] hover:shadow-[0_6px_20px_0_rgba(79,70,229,0.4)] active:scale-95',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
          ].join(' ')}
        >
          <Send className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Helper text */}
      <p className="mt-1.5 text-xs text-slate-500 hidden sm:block">
        {awsAvailable
          ? 'Click the mic to record with AWS Transcribe Medical · Enter to submit · Shift+Enter for a new line'
          : 'Press Enter to submit, Shift+Enter for a new line'}
      </p>
    </div>
  );
}
