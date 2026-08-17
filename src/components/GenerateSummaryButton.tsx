import { FileText, Loader2 } from 'lucide-react';
import { useSummaryGeneration } from '@/hooks/useSummaryGeneration';

/**
 * A prominent button that triggers shift summary generation.
 * Visible only when there's at least one structured note or checked checklist item.
 * Shows a loading state with spinner during the simulated AI delay.
 */
export function GenerateSummaryButton() {
  const { canGenerate, generateSummary, isGenerating } = useSummaryGeneration();

  if (!canGenerate) return null;

  return (
    <button
      type="button"
      onClick={generateSummary}
      disabled={isGenerating}
      aria-live="polite"
      className="
        w-full flex items-center justify-center gap-2.5
        min-h-[44px] px-6 py-3
        bg-gradient-to-r from-indigo-600 to-violet-600 text-white
        font-semibold text-sm rounded-lg
        shadow-[0_4px_14px_0_rgba(79,70,229,0.3)]
        hover:-translate-y-0.5 hover:shadow-[0_6px_20px_0_rgba(79,70,229,0.4)]
        active:translate-y-0 active:shadow-[0_2px_8px_0_rgba(79,70,229,0.3)]
        transition-all duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
        disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_14px_0_rgba(79,70,229,0.3)]
      "
      aria-label={isGenerating ? 'Generating shift summary' : 'Generate shift summary'}
      aria-busy={isGenerating}
    >
      {isGenerating ? (
        <>
          <Loader2
            className="w-4.5 h-4.5 animate-spin"
            aria-hidden="true"
          />
          <span>Generating Summary...</span>
        </>
      ) : (
        <>
          <FileText className="w-4.5 h-4.5" aria-hidden="true" />
          <span>Generate Shift Summary</span>
        </>
      )}
    </button>
  );
}
