/**
 * Core data model interfaces for the Nursing Notes application.
 */

export interface Patient {
  id: string;
  name: string;
  room: string;
  age: number;
  conditions: string[];
  allergies: string[];
}

export interface ChecklistItem {
  id: string;
  patientId: string;
  category: string;
  label: string;
  description: string;
  isChecked: boolean;
  checkedAt?: number;
  notes?: string;
}

export interface ConversationMessage {
  id: string;
  type: 'nurse-input' | 'ai-response' | 'follow-up-question' | 'nurse-response';
  content: string;
  timestamp: number;
  relatedChecklistItems?: string[];
}

export interface StructuredNote {
  id: string;
  checklistItemId?: string;
  category: string;
  content: string;
  extractedFrom: string;
  timestamp: number;
}

export interface FollowUpQuestion {
  id: string;
  question: string;
  relatedChecklistItemId?: string;
  answered: boolean;
  response?: string;
}

export interface ShiftSummary {
  id: string;
  patientId: string;
  generatedAt: number;
  sections: SummarySection[];
  finalized: boolean;
}

export interface SummarySection {
  id: string;
  title: string;
  content: string;
  isEditing: boolean;
}

export interface DocumentationSessionState {
  patient: Patient | null;
  checklist: ChecklistItem[];
  messages: ConversationMessage[];
  structuredNotes: StructuredNote[];
  summary: ShiftSummary | null;
  isProcessing: boolean;
  phase: 'patient-selection' | 'documentation' | 'summary';
}
