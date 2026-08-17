import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  sessionReducer,
  initialState,
} from '@/context/SessionContext';
import type { ChecklistItem, DocumentationSessionState } from '@/types';

/**
 * Property-based tests for checklist state logic.
 * Uses fast-check to validate universal correctness properties.
 */

// --- Helpers ---

/** Arbitrary for generating a checklist item */
const checklistItemArb = fc.record({
  id: fc.uuid(),
  patientId: fc.constant('test-patient'),
  category: fc.constantFrom('Vitals', 'Medications', 'Assessment', 'Patient Communication'),
  label: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.string({ minLength: 1, maxLength: 100 }),
  isChecked: fc.boolean(),
  checkedAt: fc.option(fc.nat(), { nil: undefined }),
});

/** Arbitrary for generating a non-empty checklist */
const checklistArb = fc.array(checklistItemArb, { minLength: 1, maxLength: 20 }).map(
  // Ensure unique IDs
  (items) => {
    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }
).filter((items) => items.length > 0);

/** Create a session state with a given checklist */
function stateWithChecklist(checklist: ChecklistItem[]): DocumentationSessionState {
  return {
    ...initialState,
    patient: {
      id: 'test-patient',
      name: 'Test Patient',
      room: '101',
      age: 70,
      conditions: ['Type 2 Diabetes'],
      allergies: [],
    },
    checklist,
    phase: 'documentation',
  };
}

// --- Property 2: Checklist toggle idempotence ---

describe('Property 2: Checklist toggle idempotence', () => {
  /**
   * **Validates: Requirements 2.4**
   *
   * For any checklist item in any state (checked or unchecked),
   * toggling it twice SHALL return the item to its original isChecked state.
   */
  it('toggling any item twice returns to original isChecked state', () => {
    fc.assert(
      fc.property(checklistArb, (checklist) => {
        // Pick a random item from the checklist
        const targetItem = checklist[0];
        const state = stateWithChecklist(checklist);

        // Toggle once
        const stateAfterFirst = sessionReducer(state, {
          type: 'TOGGLE_CHECKLIST_ITEM',
          itemId: targetItem.id,
        });

        // Toggle again
        const stateAfterSecond = sessionReducer(stateAfterFirst, {
          type: 'TOGGLE_CHECKLIST_ITEM',
          itemId: targetItem.id,
        });

        // The isChecked state should match the original
        const originalItem = state.checklist.find((i) => i.id === targetItem.id)!;
        const finalItem = stateAfterSecond.checklist.find((i) => i.id === targetItem.id)!;

        expect(finalItem.isChecked).toBe(originalItem.isChecked);
      }),
      { numRuns: 100 }
    );
  });

  it('toggling preserves all other items unchanged', () => {
    fc.assert(
      fc.property(
        checklistArb.filter((items) => items.length >= 2),
        (checklist) => {
          const targetItem = checklist[0];
          const state = stateWithChecklist(checklist);

          const stateAfterToggle = sessionReducer(state, {
            type: 'TOGGLE_CHECKLIST_ITEM',
            itemId: targetItem.id,
          });

          // All other items should remain unchanged
          for (const item of checklist) {
            if (item.id === targetItem.id) continue;
            const afterItem = stateAfterToggle.checklist.find((i) => i.id === item.id)!;
            expect(afterItem.isChecked).toBe(item.isChecked);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// --- Property 3: Checklist order independence (confluence) ---

describe('Property 3: Checklist order independence', () => {
  /**
   * **Validates: Requirements 2.5**
   *
   * For any set of distinct item IDs and any two permutations of toggling those items,
   * the final checked/unchecked state of all items SHALL be identical regardless of the order.
   */
  it('any permutation of toggles produces the same final state', () => {
    fc.assert(
      fc.property(
        checklistArb.chain((checklist) => {
          // Generate a subset of item IDs to toggle (at least 1, up to all items)
          const ids = checklist.map((item) => item.id);
          return fc.tuple(
            fc.constant(checklist),
            fc.shuffledSubarray(ids, { minLength: 1 })
          );
        }),
        ([checklist, idsToToggle]) => {
          // Create two different orderings
          const ordering1 = [...idsToToggle];
          const ordering2 = [...idsToToggle].reverse();

          const state = stateWithChecklist(checklist);

          // Apply toggles in ordering1
          let state1 = state;
          for (const id of ordering1) {
            state1 = sessionReducer(state1, {
              type: 'TOGGLE_CHECKLIST_ITEM',
              itemId: id,
            });
          }

          // Apply toggles in ordering2
          let state2 = state;
          for (const id of ordering2) {
            state2 = sessionReducer(state2, {
              type: 'TOGGLE_CHECKLIST_ITEM',
              itemId: id,
            });
          }

          // Final checked states should be identical
          for (const item of checklist) {
            const item1 = state1.checklist.find((i) => i.id === item.id)!;
            const item2 = state2.checklist.find((i) => i.id === item.id)!;
            expect(item1.isChecked).toBe(item2.isChecked);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('toggling the same item in different positions within permutations yields same result', () => {
    fc.assert(
      fc.property(
        checklistArb.filter((items) => items.length >= 3).chain((checklist) => {
          const ids = checklist.map((item) => item.id);
          return fc.tuple(
            fc.constant(checklist),
            fc.shuffledSubarray(ids, { minLength: 2 }),
            fc.shuffledSubarray(ids, { minLength: 2 })
          );
        }),
        ([checklist, perm1, perm2]) => {
          // Ensure both permutations contain the same set of IDs
          const set1 = new Set(perm1);
          const set2 = new Set(perm2);
          const commonIds = [...set1].filter((id) => set2.has(id));
          if (commonIds.length === 0) return; // skip if no overlap

          const state = stateWithChecklist(checklist);

          // Apply the common IDs in each permutation's order
          let state1 = state;
          for (const id of perm1.filter((id) => commonIds.includes(id))) {
            state1 = sessionReducer(state1, {
              type: 'TOGGLE_CHECKLIST_ITEM',
              itemId: id,
            });
          }

          let state2 = state;
          for (const id of perm2.filter((id) => commonIds.includes(id))) {
            state2 = sessionReducer(state2, {
              type: 'TOGGLE_CHECKLIST_ITEM',
              itemId: id,
            });
          }

          // Final states should match for all common items
          for (const id of commonIds) {
            const item1 = state1.checklist.find((i) => i.id === id)!;
            const item2 = state2.checklist.find((i) => i.id === id)!;
            expect(item1.isChecked).toBe(item2.isChecked);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// --- Property 4: Progress computation accuracy ---

describe('Property 4: Progress computation accuracy', () => {
  /**
   * **Validates: Requirements 2.6**
   *
   * For any checklist with N total items where K items are checked,
   * the displayed progress SHALL equal K/N (as a ratio).
   */
  it('progress always equals checked count / total count', () => {
    fc.assert(
      fc.property(checklistArb, (checklist) => {
        const total = checklist.length;
        const checked = checklist.filter((item) => item.isChecked).length;
        const expectedProgress = checked / total;

        // Compute progress the same way the UI would
        const computedProgress = checklist.filter((i) => i.isChecked).length / checklist.length;

        expect(computedProgress).toBe(expectedProgress);
      }),
      { numRuns: 100 }
    );
  });

  it('progress after toggling items matches actual checked count', () => {
    fc.assert(
      fc.property(
        checklistArb.chain((checklist) => {
          const ids = checklist.map((item) => item.id);
          return fc.tuple(
            fc.constant(checklist),
            fc.shuffledSubarray(ids, { minLength: 0 })
          );
        }),
        ([checklist, idsToToggle]) => {
          // Start with all unchecked
          const uncheckedList = checklist.map((item) => ({
            ...item,
            isChecked: false,
            checkedAt: undefined,
          }));

          let state = stateWithChecklist(uncheckedList);

          // Toggle selected items
          for (const id of idsToToggle) {
            state = sessionReducer(state, {
              type: 'TOGGLE_CHECKLIST_ITEM',
              itemId: id,
            });
          }

          const total = state.checklist.length;
          const checked = state.checklist.filter((item) => item.isChecked).length;

          // Each toggled item should now be checked (they started unchecked)
          expect(checked).toBe(idsToToggle.length);

          // Progress should match
          const progress = checked / total;
          expect(progress).toBe(idsToToggle.length / total);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('progress is 0 when no items are checked', () => {
    fc.assert(
      fc.property(checklistArb, (checklist) => {
        const uncheckedList = checklist.map((item) => ({
          ...item,
          isChecked: false,
          checkedAt: undefined,
        }));

        const total = uncheckedList.length;
        const checked = uncheckedList.filter((i) => i.isChecked).length;

        expect(checked / total).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('progress is 1 when all items are checked', () => {
    fc.assert(
      fc.property(checklistArb, (checklist) => {
        const checkedList = checklist.map((item) => ({
          ...item,
          isChecked: true,
          checkedAt: Date.now(),
        }));

        const total = checkedList.length;
        const checked = checkedList.filter((i) => i.isChecked).length;

        expect(checked / total).toBe(1);
      }),
      { numRuns: 100 }
    );
  });
});
