/**
 * Mock AI service implementing the MockAIService interface.
 * Provides simulated AI-powered input processing, follow-up question generation,
 * and shift summary generation using predefined templates and keyword matching.
 */

import type {
  ChecklistItem,
  ConversationMessage,
  FollowUpQuestion,
  Patient,
  ShiftSummary,
  StructuredNote,
  SummarySection,
} from '@/types';
import type { AIProcessingResult, MockAIService } from '@/types/services';
import {
  acknowledgmentTemplates,
  followUpQuestionTemplates,
  keywordToChecklistMapping,
  noteTemplates,
  summaryPhraseTemplates,
  summarySectionTitles,
} from '@/data/ai-templates';

/** Simple counter for generating unique IDs */
let idCounter = 0;
function generateId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

/**
 * Returns a promise that resolves after a random delay between 500ms and 2000ms.
 * Simulates realistic AI processing time per Requirement 9.2.
 */
export function simulateDelay(): Promise<void> {
  const delay = Math.floor(Math.random() * 1501) + 500; // 500–2000ms
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Extracts checklist item IDs matched by keywords in the nurse input.
 * Only returns items that are currently unchecked.
 */
function extractMatchedItemIds(
  input: string,
  checklist: ChecklistItem[]
): string[] {
  const lowerInput = input.toLowerCase();
  const matchedIds = new Set<string>();

  for (const [keyword, itemIds] of Object.entries(keywordToChecklistMapping)) {
    if (lowerInput.includes(keyword)) {
      for (const id of itemIds) {
        matchedIds.add(id);
      }
    }
  }

  // Filter to only include items in the patient's checklist that are unchecked
  const validUncheckedIds = checklist
    .filter((item) => !item.isChecked && matchedIds.has(item.id))
    .map((item) => item.id);

  return validUncheckedIds;
}

/**
 * Generates structured notes from nurse input based on matched checklist items.
 */
function generateStructuredNotes(
  input: string,
  matchedItemIds: string[],
  checklist: ChecklistItem[]
): StructuredNote[] {
  const notes: StructuredNote[] = [];

  if (matchedItemIds.length === 0) {
    // If no specific items matched, create a general note
    notes.push({
      id: generateId('note'),
      category: 'Assessment',
      content: `Clinical assessment: ${input}.`,
      extractedFrom: input,
      timestamp: Date.now(),
    });
    return notes;
  }

  for (const itemId of matchedItemIds) {
    const item = checklist.find((c) => c.id === itemId);
    if (!item) continue;

    const templates = noteTemplates[item.category] || noteTemplates['Assessment'];
    const template = templates[Math.floor(Math.random() * templates.length)];
    const content = template.replace('{content}', input);

    notes.push({
      id: generateId('note'),
      checklistItemId: itemId,
      category: item.category,
      content,
      extractedFrom: input,
      timestamp: Date.now(),
    });
  }

  return notes;
}

/**
 * Selects relevant follow-up questions based on unchecked items and patient conditions.
 * Returns 1-2 questions from the templates.
 */
function selectFollowUpQuestions(
  patient: Patient,
  uncheckedItems: ChecklistItem[],
  _sessionContext: ConversationMessage[]
): FollowUpQuestion[] {
  const questions: FollowUpQuestion[] = [];
  const availableQuestions: { question: string; relatedItemId?: string }[] = [];

  for (const condition of patient.conditions) {
    const conditionQuestions = followUpQuestionTemplates[condition];
    if (!conditionQuestions) continue;

    // Find unchecked items related to this condition
    const conditionUnchecked = uncheckedItems.filter((item) =>
      item.id.startsWith(conditionToPrefix(condition))
    );

    for (const q of conditionQuestions) {
      const relatedItem = conditionUnchecked.length > 0
        ? conditionUnchecked[Math.floor(Math.random() * conditionUnchecked.length)]
        : undefined;
      availableQuestions.push({
        question: q,
        relatedItemId: relatedItem?.id,
      });
    }
  }

  // Pick 1-2 random questions (avoid duplicates)
  const count = Math.min(availableQuestions.length, Math.random() < 0.5 ? 1 : 2);
  const shuffled = availableQuestions.sort(() => Math.random() - 0.5);

  for (let i = 0; i < count; i++) {
    const selected = shuffled[i];
    questions.push({
      id: generateId('fq'),
      question: selected.question,
      relatedChecklistItemId: selected.relatedItemId,
      answered: false,
    });
  }

  return questions;
}

/**
 * Maps a condition name to its checklist item ID prefix.
 */
function conditionToPrefix(condition: string): string {
  switch (condition) {
    case 'Type 2 Diabetes':
      return 'diabetes-';
    case 'Hypertension':
      return 'hyper-';
    case 'Heart Failure':
      return 'hf-';
    case 'COPD':
      return 'copd-';
    default:
      return '';
  }
}

/**
 * Maps a note category to the appropriate summary section title.
 */
function categoryToSectionTitle(category: string): string {
  switch (category) {
    case 'Vitals':
      return 'Vital Signs';
    case 'Medications':
      return 'Medications';
    case 'Assessment':
      return 'Patient Assessment';
    case 'Patient Communication':
      return 'Observations & Interventions';
    default:
      return 'Observations & Interventions';
  }
}

/**
 * Picks a random acknowledgment template for AI responses.
 */
export function getRandomAcknowledgment(): string {
  return acknowledgmentTemplates[
    Math.floor(Math.random() * acknowledgmentTemplates.length)
  ];
}

/**
 * The mock AI service singleton.
 * All methods include a simulated delay between 500ms and 2000ms.
 */
const mockAIService: MockAIService = {
  async processInput(
    input: string,
    patient: Patient,
    checklist: ChecklistItem[],
    sessionContext: ConversationMessage[]
  ): Promise<AIProcessingResult> {
    await simulateDelay();

    const checkedItemIds = extractMatchedItemIds(input, checklist);
    const structuredNotes = generateStructuredNotes(input, checkedItemIds, checklist);

    // Generate follow-up questions based on remaining unchecked items
    const uncheckedItems = checklist.filter(
      (item) => !item.isChecked && !checkedItemIds.includes(item.id)
    );
    const followUpQuestions = selectFollowUpQuestions(
      patient,
      uncheckedItems,
      sessionContext
    );

    return {
      structuredNotes,
      checkedItemIds,
      followUpQuestions,
    };
  },

  async generateFollowUpQuestions(
    patient: Patient,
    uncheckedItems: ChecklistItem[],
    _sessionContext: ConversationMessage[]
  ): Promise<FollowUpQuestion[]> {
    await simulateDelay();

    const questions: FollowUpQuestion[] = [];
    const availableQuestions: { question: string; relatedItemId?: string }[] = [];

    for (const condition of patient.conditions) {
      const conditionQuestions = followUpQuestionTemplates[condition];
      if (!conditionQuestions) continue;

      // Find unchecked items related to this condition
      const conditionUnchecked = uncheckedItems.filter((item) =>
        item.id.startsWith(conditionToPrefix(condition))
      );

      for (const q of conditionQuestions) {
        const relatedItem = conditionUnchecked.length > 0
          ? conditionUnchecked[Math.floor(Math.random() * conditionUnchecked.length)]
          : undefined;
        availableQuestions.push({
          question: q,
          relatedItemId: relatedItem?.id,
        });
      }
    }

    // Pick 2-3 questions
    const count = Math.min(
      availableQuestions.length,
      2 + (Math.random() < 0.5 ? 1 : 0)
    );
    const shuffled = availableQuestions.sort(() => Math.random() - 0.5);

    for (let i = 0; i < count; i++) {
      const selected = shuffled[i];
      questions.push({
        id: generateId('fq'),
        question: selected.question,
        relatedChecklistItemId: selected.relatedItemId,
        answered: false,
      });
    }

    return questions;
  },

  async generateSummary(
    patient: Patient,
    checklist: ChecklistItem[],
    notes: StructuredNote[],
    _sessionContext: ConversationMessage[]
  ): Promise<ShiftSummary> {
    await simulateDelay();

    // Group notes by their mapped summary section
    const notesBySection: Record<string, StructuredNote[]> = {};
    for (const title of summarySectionTitles) {
      notesBySection[title] = [];
    }

    for (const note of notes) {
      const sectionTitle = categoryToSectionTitle(note.category);
      if (notesBySection[sectionTitle]) {
        notesBySection[sectionTitle].push(note);
      } else {
        notesBySection['Observations & Interventions'].push(note);
      }
    }

    // Also group checked checklist items into their respective sections
    const checkedItems = checklist.filter((item) => item.isChecked);
    for (const item of checkedItems) {
      const sectionTitle = categoryToSectionTitle(item.category);
      // Only add if no note already covers this item
      const alreadyCovered = notes.some(
        (n) => n.checklistItemId === item.id
      );
      if (!alreadyCovered && notesBySection[sectionTitle]) {
        // Create a pseudo-note from the checked item
        notesBySection[sectionTitle].push({
          id: generateId('checklist-note'),
          checklistItemId: item.id,
          category: item.category,
          content: `${item.label}: Completed.${item.notes ? ' ' + item.notes : ''}`,
          extractedFrom: 'checklist',
          timestamp: item.checkedAt || Date.now(),
        });
      }
    }

    // Build summary sections
    const sections: SummarySection[] = summarySectionTitles.map((title) => {
      const sectionNotes = notesBySection[title] || [];
      const phrases = summaryPhraseTemplates[title] || [];

      let content: string;
      if (sectionNotes.length > 0) {
        // Combine note content with a template phrase
        const noteContent = sectionNotes.map((n) => n.content).join(' ');
        const phrase = phrases[Math.floor(Math.random() * phrases.length)];
        content = `${noteContent} ${phrase}`;
      } else {
        // Use a default phrase if no notes for this section
        content = phrases.length > 0
          ? phrases[Math.floor(Math.random() * phrases.length)]
          : 'No observations documented for this area.';
      }

      return {
        id: generateId('section'),
        title,
        content,
        isEditing: false,
      };
    });

    return {
      id: generateId('summary'),
      patientId: patient.id,
      generatedAt: Date.now(),
      sections,
      finalized: false,
    };
  },
};

export default mockAIService;
