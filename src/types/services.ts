/**
 * Service interfaces for the mock AI layer.
 */

import type {
  ChecklistItem,
  ConversationMessage,
  FollowUpQuestion,
  Patient,
  ShiftSummary,
  StructuredNote,
} from './index';

export interface AIProcessingResult {
  structuredNotes: StructuredNote[];
  checkedItemIds: string[];
  followUpQuestions: FollowUpQuestion[];
}

export interface MockAIService {
  processInput(
    input: string,
    patient: Patient,
    checklist: ChecklistItem[],
    sessionContext: ConversationMessage[]
  ): Promise<AIProcessingResult>;

  generateFollowUpQuestions(
    patient: Patient,
    uncheckedItems: ChecklistItem[],
    sessionContext: ConversationMessage[]
  ): Promise<FollowUpQuestion[]>;

  generateSummary(
    patient: Patient,
    checklist: ChecklistItem[],
    notes: StructuredNote[],
    sessionContext: ConversationMessage[]
  ): Promise<ShiftSummary>;
}
