import { Sparkles } from 'lucide-react';
import type { ConversationMessage } from '@/types';

interface MessageBubbleProps {
  message: ConversationMessage;
  variant: 'nurse' | 'ai';
}

/**
 * MessageBubble renders a single conversation message with distinct styling
 * for nurse input (right-aligned, gradient) and AI responses (left-aligned, white).
 */
export function MessageBubble({ message, variant }: MessageBubbleProps) {
  const isNurse = variant === 'nurse';

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`flex ${isNurse ? 'justify-end' : 'justify-start'}`}
      role="article"
      aria-label={`${isNurse ? 'Your message' : 'AI Assistant message'} at ${formattedTime}`}
    >
      <div className={`max-w-[90%] sm:max-w-[80%] ${isNurse ? 'items-end' : 'items-start'}`}>
        {/* AI icon */}
        {!isNurse && (
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles
              className="w-3.5 h-3.5 text-indigo-500"
              aria-hidden="true"
            />
            <span className="text-xs font-medium text-indigo-600">
              AI Assistant
            </span>
          </div>
        )}

        {/* Bubble */}
        <div
          className={[
            'p-3 sm:p-4 text-sm leading-relaxed',
            isNurse
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-tl-xl rounded-tr-xl rounded-bl-xl shadow-[0_4px_14px_0_rgba(79,70,229,0.2)]'
              : 'bg-white border border-slate-100 text-slate-900 rounded-tl-xl rounded-tr-xl rounded-br-xl shadow-[0_2px_8px_0_rgba(79,70,229,0.06)]',
          ].join(' ')}
        >
          {message.content}
        </div>

        {/* Timestamp */}
        <p
          className={`mt-1 text-xs text-slate-500 ${
            isNurse ? 'text-right' : 'text-left'
          }`}
        >
          {formattedTime}
        </p>
      </div>
    </div>
  );
}
