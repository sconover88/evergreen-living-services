import { useCallback, useMemo } from 'react';
import { useSession } from '@/context/SessionContext';
import mockAIService from '@/services/mockAIService';

/**
 * Custom hook that manages the summary generation flow.
 * Provides the ability to generate a shift summary from session data,
 * tracks whether generation is possible, and handles loading state.
 */
export function useSummaryGeneration() {
  const { state, setSummary, setProcessing } = useSession();

  /** Summary can be generated when there are structured notes or checked items */
  const canGenerate = useMemo(
    () =>
      state.structuredNotes.length > 0 ||
      state.checklist.some((item) => item.isChecked),
    [state.structuredNotes, state.checklist]
  );

  /** Calls the mock AI service to generate a shift summary and transitions to summary phase */
  const generateSummary = useCallback(async () => {
    if (!state.patient || !canGenerate) return;

    setProcessing(true);

    try {
      const summary = await mockAIService.generateSummary(
        state.patient,
        state.checklist,
        state.structuredNotes,
        state.messages
      );

      setSummary(summary);
    } finally {
      setProcessing(false);
    }
  }, [
    state.patient,
    state.checklist,
    state.structuredNotes,
    state.messages,
    canGenerate,
    setSummary,
    setProcessing,
  ]);

  return {
    canGenerate,
    generateSummary,
    isGenerating: state.isProcessing,
  };
}
