import { useState, useRef, useCallback, useEffect, type KeyboardEvent } from 'react';
import { Mic, Send } from 'lucide-react';

interface ConversationInputProps {
  onSubmit: (text: string) => void;
  disabled: boolean;
  placeholder?: string;
  /** If provided, clicking the textarea when empty triggers a character-by-character transcription simulation. */
  simulatedText?: string | null;
  /** Called when the simulation has been consumed (finished typing or started). */
  onSimulationUsed?: () => void;
}

/**
 * ConversationInput provides a textarea styled as a voice transcription input.
 * Supports Enter to submit (Shift+Enter for newlines), disables when empty
 * or during AI processing. Styled with Corporate Trust design tokens.
 *
 * When `simulatedText` is provided and the textarea is empty, clicking/focusing
 * the input triggers a live transcription simulation — text appears character
 * by character with natural pauses at punctuation.
 */
export function ConversationInput({
  onSubmit,
  disabled,
  placeholder = 'Type your observations here...',
  simulatedText = null,
  onSimulationUsed,
}: ConversationInputProps) {
  const [value, setValue] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const charIndexRef = useRef(0);
  const simulationActiveRef = useRef(false);

  const trimmed = value.trim();
  const isSubmitDisabled = disabled || trimmed.length === 0 || isTranscribing;

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const getCharDelay = (char: string): number => {
    if (char === '.') return 300;
    if (char === ',') return 150;
    if (char === ' ') return 70;
    // Standard character delay: ~50ms for natural pace
    return 50;
  };

  const startTranscription = useCallback(() => {
    if (!simulatedText || simulationActiveRef.current) return;

    simulationActiveRef.current = true;
    setIsTranscribing(true);
    charIndexRef.current = 0;

    const typeNextChar = () => {
      if (charIndexRef.current >= simulatedText.length) {
        // Done transcribing — notify parent that transcription was consumed
        setIsTranscribing(false);
        simulationActiveRef.current = false;
        intervalRef.current = null;
        onSimulationUsed?.();
        return;
      }

      const currentChar = simulatedText[charIndexRef.current];
      charIndexRef.current += 1;

      setValue(simulatedText.slice(0, charIndexRef.current));

      const delay = getCharDelay(currentChar);
      intervalRef.current = setTimeout(typeNextChar, delay);
    };

    // Small initial delay before typing starts
    intervalRef.current = setTimeout(typeNextChar, 200);
  }, [simulatedText, onSimulationUsed]);

  const handleFocus = useCallback(() => {
    // No-op: simulation is triggered by explicit click, not focus alone
  }, []);

  const handleClick = useCallback(() => {
    // Only start simulation if: there's text to simulate, textarea is empty, and not already transcribing
    if (simulatedText && value === '' && !isTranscribing && !simulationActiveRef.current && !disabled) {
      startTranscription();
    }
  }, [simulatedText, value, isTranscribing, disabled, startTranscription]);

  const handleSubmit = useCallback(() => {
    if (isSubmitDisabled) return;
    onSubmit(trimmed);
    setValue('');
    // Refocus the textarea after submit
    textareaRef.current?.focus();
  }, [isSubmitDisabled, onSubmit, trimmed]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full" role="form" aria-label="Observation input">
      {/* Label */}
      <label
        htmlFor="conversation-input"
        className="block text-sm font-medium text-slate-600 mb-2"
      >
        <span className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-indigo-500" aria-hidden="true" />
          Share your observations...
        </span>
      </label>

      {/* Recording indicator */}
      {isTranscribing && (
        <div
          className="flex items-center gap-2 mb-2"
          role="status"
          aria-live="polite"
          aria-label="Voice transcription in progress"
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
          <span className="text-xs text-slate-500">Transcribing...</span>
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
            // If user types manually during a simulation, stop the simulation
            if (simulationActiveRef.current && simulatedText) {
              const expectedSoFar = simulatedText.slice(0, charIndexRef.current);
              if (newVal !== expectedSoFar && newVal !== simulatedText.slice(0, charIndexRef.current + 1)) {
                // User is typing something different — abort simulation
                if (intervalRef.current) {
                  clearTimeout(intervalRef.current);
                  intervalRef.current = null;
                }
                setIsTranscribing(false);
                simulationActiveRef.current = false;
              }
            }
            setValue(newVal);
          }}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
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
        Press Enter to submit, Shift+Enter for a new line
      </p>
    </div>
  );
}
