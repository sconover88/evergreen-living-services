import { useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import type { ConversationMessage } from '@/types';
import { MessageBubble } from './MessageBubble';
import { ConversationInput } from './ConversationInput';

interface ConversationPanelProps {
  messages: ConversationMessage[];
  onSubmitInput: (text: string) => void;
  isProcessing: boolean;
}

/**
 * ConversationPanel displays the full message history as a scrollable conversation.
 * Auto-scrolls on new messages, shows a typing indicator during AI processing,
 * and includes ConversationInput at the bottom.
 */
export function ConversationPanel({
  messages,
  onSubmitInput,
  isProcessing,
}: ConversationPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change or processing starts
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  return (
    <section
      className="flex flex-col bg-slate-50 border border-slate-200 rounded-xl overflow-hidden"
      aria-label="Conversation panel"
    >
      {/* Messages area - aria-live announces new messages to screen readers */}
      <div
        className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 sm:space-y-4 max-h-[320px] sm:max-h-[400px] lg:max-h-[480px] min-h-[200px]"
        role="log"
        aria-label="Conversation messages"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <Sparkles
              className="w-8 h-8 text-indigo-300 mb-3"
              aria-hidden="true"
            />
            <p className="text-sm text-slate-500">
              Start documenting by sharing your observations below.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            variant={
              message.type === 'nurse-input' || message.type === 'nurse-response'
                ? 'nurse'
                : 'ai'
            }
          />
        ))}

        {/* Loading / typing indicator */}
        {isProcessing && <TypingIndicator />}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* Input area */}
      <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
        <ConversationInput onSubmit={onSubmitInput} disabled={isProcessing} />
      </div>
    </section>
  );
}

/**
 * TypingIndicator shows an animated "AI is thinking" state
 * with three pulsing dots styled in Corporate Trust indigo.
 */
function TypingIndicator() {
  return (
    <div className="flex justify-start" role="status" aria-label="AI is processing your input">
      <div className="max-w-[80%]">
        <div className="flex items-center gap-1.5 mb-1">
          <Sparkles
            className="w-3.5 h-3.5 text-indigo-500"
            aria-hidden="true"
          />
          <span className="text-xs font-medium text-indigo-600">
            AI Assistant
          </span>
        </div>
        <div className="bg-white border border-slate-100 rounded-tl-xl rounded-tr-xl rounded-br-xl p-4 shadow-[0_2px_8px_0_rgba(79,70,229,0.06)]">
          <div className="flex items-center gap-2">
            <span className="flex gap-1" aria-hidden="true">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '300ms' }} />
            </span>
            <span className="text-xs text-slate-500 ml-1">
              AI is analyzing your input...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
