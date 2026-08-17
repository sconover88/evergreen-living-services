import { useState, useCallback, useRef } from 'react';
import { User, MapPin, Activity, AlertTriangle } from 'lucide-react';
import { useSession } from '@/context/SessionContext';
import mockAIService, { getRandomAcknowledgment } from '@/services/mockAIService';
import { simulatedTranscriptions } from '@/data/simulated-transcriptions';
import { Checklist } from './Checklist';
import { ConversationPanel } from './ConversationPanel';
import { AIQuestions } from './AIQuestions';
import { GenerateSummaryButton } from './GenerateSummaryButton';
import { SummaryEditor } from './SummaryEditor';
import type { FollowUpQuestion } from '@/types';

/**
 * DocumentationSession is the main documentation view rendered when a patient
 * is selected. It composes all sub-components on a single scrollable page with
 * smooth scroll behavior and wires the full interaction flow:
 *
 * - Nurse input → AI processInput → notes + auto-check → follow-up questions
 * - Follow-up responses → AI processing → note updates
 * - Generate summary → AI generateSummary → SummaryEditor
 * - Finalize → mark summary as finalized
 *
 * Requirements: 2.3, 3.2, 3.4, 4.4, 5.1, 6.4, 7.2, 7.5
 */
export function DocumentationSession() {
  const {
    state,
    toggleChecklistItem,
    addMessage,
    addNotes,
    autoCheckItems,
    editSummarySection,
    finalizeSummary,
    setProcessing,
  } = useSession();

  const [followUpQuestions, setFollowUpQuestions] = useState<FollowUpQuestion[]>([]);

  // --- Simulated voice transcription queue ---
  const transcriptionIndexRef = useRef(0);
  const [currentTranscription, setCurrentTranscription] = useState<string | null>(null);

  const { patient, checklist, messages, isProcessing, summary } = state;

  /**
   * Build a flat list of transcriptions for the current patient's conditions.
   * Interleaves observations from all conditions so the user gets variety.
   */
  const getTranscriptionsForPatient = useCallback(() => {
    if (!patient) return [];
    const allTexts: string[] = [];
    const conditionTexts = patient.conditions.map(
      (c) => simulatedTranscriptions[c] ?? []
    );
    const maxLen = Math.max(...conditionTexts.map((t) => t.length), 0);
    for (let i = 0; i < maxLen; i++) {
      for (const texts of conditionTexts) {
        if (i < texts.length) {
          allTexts.push(texts[i]);
        }
      }
    }
    return allTexts;
  }, [patient]);

  /**
   * Advance the transcription queue when a simulation is consumed.
   */
  const handleSimulationUsed = useCallback(() => {
    transcriptionIndexRef.current += 1;
    setCurrentTranscription(null);
  }, []);

  /**
   * Compute the next transcription text to offer. Called lazily when needed.
   */
  const getNextTranscription = useCallback((): string | null => {
    const queue = getTranscriptionsForPatient();
    if (transcriptionIndexRef.current >= queue.length) return null;
    return queue[transcriptionIndexRef.current];
  }, [getTranscriptionsForPatient]);

  // Provide the current transcription text (null if none left)
  const simulatedText = currentTranscription ?? getNextTranscription();

  // --- Interaction flow: Nurse submits input ---
  const handleSubmitInput = useCallback(
    async (text: string) => {
      if (!patient) return;

      // 1. Add nurse message to conversation history
      addMessage({
        id: `msg-${Date.now()}-nurse`,
        type: 'nurse-input',
        content: text,
        timestamp: Date.now(),
      });

      // 2. Set processing state
      setProcessing(true);

      try {
        // 3. Call mock AI service
        const result = await mockAIService.processInput(
          text,
          patient,
          checklist,
          messages
        );

        // 4a. Add structured notes
        if (result.structuredNotes.length > 0) {
          addNotes(result.structuredNotes);
        }

        // 4b. Auto-check matched items
        if (result.checkedItemIds.length > 0) {
          autoCheckItems(result.checkedItemIds);
        }

        // 4c. Add AI acknowledgment message
        addMessage({
          id: `msg-${Date.now()}-ai`,
          type: 'ai-response',
          content: getRandomAcknowledgment(),
          timestamp: Date.now(),
          relatedChecklistItems: result.checkedItemIds,
        });

        // 4d. Store follow-up questions
        if (result.followUpQuestions.length > 0) {
          setFollowUpQuestions((prev) => [...prev, ...result.followUpQuestions]);
        }
      } finally {
        // 4e. Set processing false
        setProcessing(false);
      }
    },
    [patient, checklist, messages, addMessage, addNotes, autoCheckItems, setProcessing]
  );

  // --- Interaction flow: Nurse responds to a follow-up question ---
  const handleRespondToQuestion = useCallback(
    async (questionId: string, response: string) => {
      if (!patient) return;

      // 1. Mark question as answered in local state
      setFollowUpQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId ? { ...q, answered: true, response } : q
        )
      );

      // 2. Add nurse response as a message
      addMessage({
        id: `msg-${Date.now()}-response`,
        type: 'nurse-response',
        content: response,
        timestamp: Date.now(),
      });

      // 3. Set processing state
      setProcessing(true);

      try {
        // 4. Process the response as additional input
        const result = await mockAIService.processInput(
          response,
          patient,
          checklist,
          messages
        );

        // 5. Update notes and auto-check items
        if (result.structuredNotes.length > 0) {
          addNotes(result.structuredNotes);
        }
        if (result.checkedItemIds.length > 0) {
          autoCheckItems(result.checkedItemIds);
        }

        // 6. Add AI acknowledgment
        addMessage({
          id: `msg-${Date.now()}-ai-resp`,
          type: 'ai-response',
          content: getRandomAcknowledgment(),
          timestamp: Date.now(),
          relatedChecklistItems: result.checkedItemIds,
        });
      } finally {
        // 7. Set processing false
        setProcessing(false);
      }
    },
    [patient, checklist, messages, addMessage, addNotes, autoCheckItems, setProcessing]
  );

  if (!patient) return null;

  const completedCount = checklist.filter((item) => item.isChecked).length;
  const totalCount = checklist.length;

  return (
    <div className="scroll-smooth space-y-5 sm:space-y-8">
      {/* Section 1: Session Header — Patient info bar */}
      <section
        aria-label="Patient information"
        className="bg-white rounded-xl border border-slate-100 p-4 sm:p-6 shadow-[0_2px_8px_0_rgba(79,70,229,0.06)]"
      >
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
          <div className="flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-indigo-50 flex items-center justify-center">
            <User className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">{patient.name}</h2>
            <div className="flex items-center gap-3 sm:gap-4 mt-1 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                Room {patient.room}
              </span>
              <span>Age {patient.age}</span>
            </div>

            {/* Conditions */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Activity className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
              {patient.conditions.map((condition) => (
                <span
                  key={condition}
                  className="bg-indigo-50 text-indigo-600 rounded-full px-3 py-1 text-xs font-medium"
                >
                  {condition}
                </span>
              ))}
            </div>

            {/* Allergies */}
            {patient.allergies.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" aria-hidden="true" />
                {patient.allergies.map((allergy) => (
                  <span
                    key={allergy}
                    className="bg-red-50 text-red-600 rounded-full px-3 py-1 text-xs font-medium"
                  >
                    {allergy}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section 2: Conversation Panel */}
      {state.phase === 'documentation' && (
        <section aria-label="Documentation conversation">
          <ConversationPanel
            messages={messages}
            onSubmitInput={handleSubmitInput}
            isProcessing={isProcessing}
            simulatedText={simulatedText}
            onSimulationUsed={handleSimulationUsed}
          />
        </section>
      )}

      {/* Section 3: AI Follow-up Questions */}
      {followUpQuestions.length > 0 && state.phase === 'documentation' && (
        <section className="bg-white rounded-xl border border-slate-100 p-4 sm:p-6 shadow-[0_2px_8px_0_rgba(79,70,229,0.06)]">
          <AIQuestions
            questions={followUpQuestions}
            onRespond={handleRespondToQuestion}
          />
        </section>
      )}

      {/* Section 4: Checklist */}
      <section className="bg-white rounded-xl border border-slate-100 p-4 sm:p-6 shadow-[0_2px_8px_0_rgba(79,70,229,0.06)]">
        <Checklist
          items={checklist}
          onToggleItem={toggleChecklistItem}
          completedCount={completedCount}
          totalCount={totalCount}
        />
      </section>

      {/* Section 5: Generate Summary Button */}
      {state.phase === 'documentation' && (
        <section aria-label="Summary generation">
          <GenerateSummaryButton />
        </section>
      )}

      {/* Section 6: Summary Editor */}
      {state.phase === 'summary' && summary && (
        <section
          className="bg-white rounded-xl border border-slate-100 p-4 sm:p-6 shadow-[0_2px_8px_0_rgba(79,70,229,0.06)]"
          aria-label="Shift summary"
        >
          <SummaryEditor
            sections={summary.sections}
            onEditSection={editSummarySection}
            onFinalize={finalizeSummary}
            isFinalized={summary.finalized}
          />
        </section>
      )}
    </div>
  );
}
