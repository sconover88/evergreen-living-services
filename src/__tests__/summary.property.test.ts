/**
 * Property-based tests for summary generation.
 * Tests Properties 8, 9, and 10 from the design document.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import mockAIService from '@/services/mockAIService';
import { sessionReducer, initialState } from '@/context/SessionContext';
import { buildChecklistForPatient } from '@/data/checklists';
import { mockPatients } from '@/data/patients';
import type {
  StructuredNote,
  ShiftSummary,
  DocumentationSessionState,
} from '@/types';

/** Generate a structured note with valid fields */
const structuredNoteArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }).map((s) => `note-${s}`),
  checklistItemId: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
  category: fc.constantFrom('Vitals', 'Medications', 'Assessment', 'Patient Communication'),
  content: fc.string({ minLength: 1, maxLength: 200 }),
  extractedFrom: fc.string({ minLength: 1, maxLength: 200 }),
  timestamp: fc.integer({ min: 1000000000000, max: 2000000000000 }),
}) as fc.Arbitrary<StructuredNote>;

// --- Test Suite ---

describe('Summary Generation Property Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * Property 8: Summary completeness
   * **Validates: Requirements 5.1, 5.3**
   *
   * For any documentation session with structured notes and checked checklist items,
   * the generated summary's content (across all sections) should contain references
   * to every structured note and every checked checklist item.
   */
  describe('Property 8: Summary completeness', () => {
    it('summary references all notes and checked items', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...mockPatients),
          fc.array(structuredNoteArb, { minLength: 1, maxLength: 5 }),
          async (patient, notes) => {
            const checklist = buildChecklistForPatient(patient.id, patient.conditions);
            // Check at least one item
            const checkedChecklist = checklist.map((item, idx) =>
              idx === 0 ? { ...item, isChecked: true, checkedAt: Date.now() } : item
            );
            const checkedItems = checkedChecklist.filter((item) => item.isChecked);

            const summaryPromise = mockAIService.generateSummary(
              patient,
              checkedChecklist,
              notes,
              []
            );
            vi.advanceTimersByTime(2000);
            const summary = await summaryPromise;

            // Combine all section contents into one string
            const combinedContent = summary.sections
              .map((s) => s.content)
              .join(' ');

            // Every note's content should appear in the combined summary
            for (const note of notes) {
              expect(combinedContent).toContain(note.content);
            }

            // Every checked item's label should appear in the combined summary
            for (const item of checkedItems) {
              expect(combinedContent).toContain(item.label);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 9: Summary structural validity
   * **Validates: Requirements 5.2**
   *
   * For any generated summary, the sections array should be non-empty and
   * every section should have a non-empty id, non-empty title, and non-empty content.
   */
  describe('Property 9: Summary structural validity', () => {
    it('non-empty sections with non-empty titles and content', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...mockPatients),
          fc.array(structuredNoteArb, { minLength: 0, maxLength: 5 }),
          async (patient, notes) => {
            const checklist = buildChecklistForPatient(patient.id, patient.conditions);

            const summaryPromise = mockAIService.generateSummary(
              patient,
              checklist,
              notes,
              []
            );
            vi.advanceTimersByTime(2000);
            const summary = await summaryPromise;

            // Sections array should be non-empty
            expect(summary.sections.length).toBeGreaterThan(0);

            // Every section should have non-empty id, title, and content
            for (const section of summary.sections) {
              expect(section.id.length).toBeGreaterThan(0);
              expect(section.title.length).toBeGreaterThan(0);
              expect(section.content.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 10: Summary section edit round-trip
   * **Validates: Requirements 6.3**
   *
   * For any summary section and any new content string, using the EDIT_SUMMARY_SECTION
   * reducer action with that content and then reading the section back should yield
   * exactly the new content string.
   */
  describe('Property 10: Summary section edit round-trip', () => {
    it('editing and reading back yields exact content', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 500 }),
          fc.integer({ min: 0, max: 4 }),
          (newContent, sectionIndex) => {
            // Set up state with a summary
            const patient = mockPatients[0];
            const summary: ShiftSummary = {
              id: 'test-summary',
              patientId: patient.id,
              generatedAt: Date.now(),
              sections: [
                { id: 'sec-1', title: 'Vital Signs', content: 'Original content 1', isEditing: false },
                { id: 'sec-2', title: 'Medications', content: 'Original content 2', isEditing: false },
                { id: 'sec-3', title: 'Patient Assessment', content: 'Original content 3', isEditing: false },
                { id: 'sec-4', title: 'Observations & Interventions', content: 'Original content 4', isEditing: false },
                { id: 'sec-5', title: 'Recommendations for Next Shift', content: 'Original content 5', isEditing: false },
              ],
              finalized: false,
            };

            const stateWithSummary: DocumentationSessionState = {
              ...initialState,
              patient,
              summary,
              phase: 'summary',
            };

            // Pick the section to edit based on the generated index
            const targetSectionId = summary.sections[sectionIndex].id;

            // Dispatch EDIT_SUMMARY_SECTION
            const newState = sessionReducer(stateWithSummary, {
              type: 'EDIT_SUMMARY_SECTION',
              sectionId: targetSectionId,
              content: newContent,
            });

            // Read the section back
            const editedSection = newState.summary!.sections.find(
              (s) => s.id === targetSectionId
            );

            // The content should be exactly what we set
            expect(editedSection).toBeDefined();
            expect(editedSection!.content).toBe(newContent);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
