/**
 * Property-based tests for the mock AI service and checklist construction.
 *
 * Uses fast-check to verify universal properties across all valid inputs.
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { buildChecklistForPatient, checklistTemplates } from '@/data/checklists';
import mockAIService, { simulateDelay } from '@/services/mockAIService';
import { mockPatients } from '@/data/patients';
import type { ConversationMessage } from '@/types';

/**
 * Property 1: Checklist construction by patient conditions
 *
 * For any patient with a set of conditions, buildChecklistForPatient should produce
 * a checklist containing exactly the items associated with those conditions,
 * and patients with different conditions should receive different checklist items.
 *
 * **Validates: Requirements 1.3, 2.1, 2.2**
 */
describe('Property 1: Checklist construction by patient conditions', () => {
  const allConditions = Object.keys(checklistTemplates);

  // Arbitrary: pick a non-empty subset of available conditions
  const conditionSubsetArb = fc
    .subarray(allConditions, { minLength: 1, maxLength: allConditions.length })
    .filter((arr) => arr.length > 0);

  it('produces exactly the items for the given conditions', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }), // patientId
        conditionSubsetArb,
        (patientId, conditions) => {
          const checklist = buildChecklistForPatient(patientId, conditions);

          // Expected total items: sum of items in templates for the given conditions
          const expectedIds = conditions.flatMap(
            (c) => checklistTemplates[c]?.map((t) => t.id) ?? []
          );

          // Checklist has the exact expected items
          const checklistIds = checklist.map((item) => item.id);
          expect(checklistIds.sort()).toEqual(expectedIds.sort());

          // All items have the correct patientId
          for (const item of checklist) {
            expect(item.patientId).toBe(patientId);
          }

          // All items start unchecked
          for (const item of checklist) {
            expect(item.isChecked).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('patients with different conditions receive different checklists', () => {
    fc.assert(
      fc.property(
        conditionSubsetArb,
        conditionSubsetArb,
        (conditions1, conditions2) => {
          // Only test when conditions are actually different
          fc.pre(
            JSON.stringify(conditions1.sort()) !==
              JSON.stringify(conditions2.sort())
          );

          const checklist1 = buildChecklistForPatient('p-a', conditions1);
          const checklist2 = buildChecklistForPatient('p-b', conditions2);

          const ids1 = checklist1.map((i) => i.id).sort();
          const ids2 = checklist2.map((i) => i.id).sort();

          expect(ids1).not.toEqual(ids2);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 5: Input processing produces valid structured notes
 *
 * For any non-empty nurse input string, processInput should produce structured notes
 * where each note has: valid id (non-empty string), non-empty content, a category,
 * and a timestamp > 0.
 *
 * **Validates: Requirements 3.2, 4.4**
 */
describe('Property 5: Input processing produces valid structured notes', () => {
  it('all notes have valid id, non-empty content, category, and positive timestamp', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...mockPatients),
        fc.string({ minLength: 1, maxLength: 200 }),
        async (patient, input) => {
          vi.useFakeTimers();
          try {
            const checklist = buildChecklistForPatient(patient.id, patient.conditions);
            const sessionContext: ConversationMessage[] = [];

            const resultPromise = mockAIService.processInput(
              input,
              patient,
              checklist,
              sessionContext
            );

            // Advance timers to resolve the simulated delay
            await vi.advanceTimersByTimeAsync(2500);

            const result = await resultPromise;

            // processInput always returns at least one note for non-empty input
            expect(result.structuredNotes.length).toBeGreaterThan(0);

            for (const note of result.structuredNotes) {
              // Valid id: non-empty string
              expect(typeof note.id).toBe('string');
              expect(note.id.length).toBeGreaterThan(0);

              // Non-empty content
              expect(typeof note.content).toBe('string');
              expect(note.content.length).toBeGreaterThan(0);

              // Has a category
              expect(typeof note.category).toBe('string');
              expect(note.category.length).toBeGreaterThan(0);

              // Positive timestamp
              expect(typeof note.timestamp).toBe('number');
              expect(note.timestamp).toBeGreaterThan(0);
            }
          } finally {
            vi.useRealTimers();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 6: Auto-checked items are a valid subset
 *
 * For any AI processing result that auto-checks checklist items, the set of
 * auto-checked item IDs should be a subset of the patient's existing checklist
 * item IDs, and should only include items that were unchecked prior to processing.
 *
 * **Validates: Requirements 3.4, 4.3**
 */
describe('Property 6: Auto-checked items are a valid subset', () => {
  it('checkedItemIds are a subset of unchecked patient checklist items', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...mockPatients),
        fc.string({ minLength: 1, maxLength: 200 }),
        // Randomly pre-check some items
        fc.nat({ max: 10 }),
        async (patient, input, preCheckCount) => {
          vi.useFakeTimers();
          try {
            const checklist = buildChecklistForPatient(patient.id, patient.conditions);

            // Randomly pre-check some items
            const itemsToPreCheck = Math.min(preCheckCount, checklist.length - 1);
            for (let i = 0; i < itemsToPreCheck; i++) {
              checklist[i].isChecked = true;
            }

            const uncheckedIds = checklist
              .filter((item) => !item.isChecked)
              .map((item) => item.id);

            const allIds = checklist.map((item) => item.id);

            const sessionContext: ConversationMessage[] = [];

            const resultPromise = mockAIService.processInput(
              input,
              patient,
              checklist,
              sessionContext
            );

            await vi.advanceTimersByTimeAsync(2500);
            const result = await resultPromise;

            // Every checked item ID must exist in the patient's checklist
            for (const checkedId of result.checkedItemIds) {
              expect(allIds).toContain(checkedId);
            }

            // Every checked item ID must have been unchecked before processing
            for (const checkedId of result.checkedItemIds) {
              expect(uncheckedIds).toContain(checkedId);
            }
          } finally {
            vi.useRealTimers();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 7: Follow-up questions reference valid patient data
 *
 * For any patient and session context, all generated follow-up questions should
 * reference only conditions or checklist items belonging to that specific patient
 * (no cross-patient data leakage).
 *
 * **Validates: Requirements 4.1, 9.3**
 */
describe('Property 7: Follow-up questions reference valid patient data', () => {
  it('all follow-up questions reference only the given patient checklist items', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...mockPatients),
        async (patient) => {
          vi.useFakeTimers();
          try {
            const checklist = buildChecklistForPatient(patient.id, patient.conditions);
            const uncheckedItems = checklist.filter((item) => !item.isChecked);
            const validItemIds = checklist.map((item) => item.id);
            const sessionContext: ConversationMessage[] = [];

            const resultPromise = mockAIService.generateFollowUpQuestions(
              patient,
              uncheckedItems,
              sessionContext
            );

            await vi.advanceTimersByTimeAsync(2500);
            const questions = await resultPromise;

            for (const question of questions) {
              // question.id should be a non-empty string
              expect(typeof question.id).toBe('string');
              expect(question.id.length).toBeGreaterThan(0);

              // question text should be a non-empty string
              expect(typeof question.question).toBe('string');
              expect(question.question.length).toBeGreaterThan(0);

              // If a relatedChecklistItemId is present, it must belong to this patient
              if (question.relatedChecklistItemId) {
                expect(validItemIds).toContain(question.relatedChecklistItemId);
              }
            }
          } finally {
            vi.useRealTimers();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('follow-up questions from processInput also reference only the given patient', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...mockPatients),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (patient, input) => {
          vi.useFakeTimers();
          try {
            const checklist = buildChecklistForPatient(patient.id, patient.conditions);
            const validItemIds = checklist.map((item) => item.id);
            const sessionContext: ConversationMessage[] = [];

            const resultPromise = mockAIService.processInput(
              input,
              patient,
              checklist,
              sessionContext
            );

            await vi.advanceTimersByTimeAsync(2500);
            const result = await resultPromise;

            for (const question of result.followUpQuestions) {
              if (question.relatedChecklistItemId) {
                expect(validItemIds).toContain(question.relatedChecklistItemId);
              }
            }
          } finally {
            vi.useRealTimers();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 11: AI response delay bounds
 *
 * For any call to simulateDelay, the delay should be between 500ms and 2000ms inclusive.
 *
 * **Validates: Requirements 9.2**
 */
describe('Property 11: AI response delay bounds', () => {
  it('simulateDelay resolves within 500ms to 2000ms bounds', () => {
    fc.assert(
      fc.property(fc.nat({ max: 999 }), (_seed) => {
        // Track the delay value passed to setTimeout
        let capturedDelay = 0;
        const originalSetTimeout = globalThis.setTimeout;

        // Temporarily replace setTimeout to capture the delay argument
        const mockSetTimeout = ((fn: () => void, delay: number) => {
          capturedDelay = delay;
          // Call the function immediately for test purposes
          fn();
          return 0 as unknown as ReturnType<typeof setTimeout>;
        }) as typeof globalThis.setTimeout;

        globalThis.setTimeout = mockSetTimeout;

        try {
          // Call simulateDelay and capture the delay
          simulateDelay();

          // Verify delay is within bounds
          expect(capturedDelay).toBeGreaterThanOrEqual(500);
          expect(capturedDelay).toBeLessThanOrEqual(2000);
        } finally {
          globalThis.setTimeout = originalSetTimeout;
        }
      }),
      { numRuns: 100 }
    );
  });
});
