# Implementation Plan: Nursing Notes App

## Overview

Implement an iPad-optimized single-page React application for nursing documentation with mocked AI assistance. The app uses React + Vite + TypeScript, Tailwind CSS with shadcn/ui, and the Corporate Trust design system. All AI behavior is mocked with simulated delays, and state is managed via React Context + useReducer.

## Tasks

- [ ] 1. Set up project structure, dependencies, and core types
  - [-] 1.1 Initialize Vite + React + TypeScript project with Tailwind CSS, shadcn/ui, and Plus Jakarta Sans font
    - Configure `vite.config.ts`, `tailwind.config.ts` with Corporate Trust design tokens (indigo/violet palette, colors, fonts)
    - Install dependencies: `lucide-react`, `fast-check` (dev), testing libraries
    - Create directory structure: `src/components/`, `src/services/`, `src/context/`, `src/data/`, `src/types/`
    - _Requirements: 7.3, 7.4_

  - [~] 1.2 Define TypeScript interfaces and types
    - Create `src/types/index.ts` with all data model interfaces: Patient, ChecklistItem, ConversationMessage, StructuredNote, FollowUpQuestion, ShiftSummary, SummarySection, DocumentationSessionState
    - Create `src/types/services.ts` with MockAIService interface and AIProcessingResult type
    - _Requirements: 1.4, 2.2_

  - [~] 1.3 Create mock data files
    - Create `src/data/patients.ts` with 3-4 mock patients with varied conditions
    - Create `src/data/checklists.ts` with condition-specific checklist templates (Diabetes, Hypertension, Heart Failure, COPD)
    - Create `src/data/ai-templates.ts` with response templates for the mock AI service
    - _Requirements: 1.4, 2.2, 9.1_

- [ ] 2. Implement state management and mock AI service
  - [~] 2.1 Implement session state context with useReducer
    - Create `src/context/SessionContext.tsx` with AppProvider, useSession hook
    - Implement reducer actions: SELECT_PATIENT, TOGGLE_CHECKLIST_ITEM, ADD_MESSAGE, ADD_NOTES, AUTO_CHECK_ITEMS, SET_SUMMARY, EDIT_SUMMARY_SECTION, FINALIZE_SUMMARY, SET_PROCESSING
    - Manage phase transitions: patient-selection → documentation → summary
    - _Requirements: 1.2, 1.3, 2.4, 2.5, 6.3_

  - [~] 2.2 Implement mock AI service module
    - Create `src/services/mockAIService.ts` implementing the MockAIService interface
    - Implement `processInput()`: extract keywords from nurse input, match to checklist items, generate structured notes
    - Implement `generateFollowUpQuestions()`: select questions based on unchecked items and patient conditions
    - Implement `generateSummary()`: compile all notes into labeled sections using clinical language templates
    - Add `simulateDelay()` utility that returns a random delay between 500ms and 2000ms
    - _Requirements: 3.2, 4.1, 4.3, 5.1, 5.2, 5.5, 9.1, 9.2_

  - [ ]* 2.3 Write property tests for checklist state logic
    - **Property 2: Checklist toggle idempotence** - toggling any item twice returns to original state
    - **Property 3: Checklist order independence** - any permutation of checks produces same final state
    - **Property 4: Progress computation accuracy** - progress always equals checked/total
    - **Validates: Requirements 2.4, 2.5, 2.6**

  - [ ]* 2.4 Write property tests for mock AI service
    - **Property 1: Checklist construction by patient conditions** - session loads correct items for conditions
    - **Property 5: Input processing produces valid structured notes** - all notes have valid fields
    - **Property 6: Auto-checked items are a valid subset** - only unchecked patient items get checked
    - **Property 7: Follow-up questions reference valid patient data** - no cross-patient leakage
    - **Property 11: AI response delay bounds** - all delays between 500ms and 2000ms
    - **Validates: Requirements 1.3, 2.2, 3.2, 3.4, 4.1, 4.3, 4.4, 9.2**

- [~] 3. Checkpoint - Core logic verification
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement patient selection UI
  - [~] 4.1 Create PatientList component
    - Create `src/components/PatientList.tsx` displaying patient cards with name, room, age, conditions
    - Style with Corporate Trust design: elevated cards, indigo-tinted shadows, hover lift effect
    - Ensure touch targets are minimum 44x44px
    - Implement `onSelectPatient` callback
    - _Requirements: 1.1, 1.2, 7.1, 7.3_

  - [~] 4.2 Create App shell and Header component
    - Create `src/components/Header.tsx` with app branding and session info
    - Create `src/App.tsx` wrapping AppProvider, rendering PatientList or DocumentationSession based on phase
    - Apply max-w-7xl container, Corporate Trust background color (#F8FAFC)
    - _Requirements: 7.2, 7.3, 7.4_

- [ ] 5. Implement checklist UI
  - [~] 5.1 Create Checklist component
    - Create `src/components/Checklist.tsx` with toggleable checklist items grouped by category
    - Display completion progress bar/indicator (checked count / total)
    - Style items as cards with checkboxes, 44px+ touch targets
    - Add ARIA labels and keyboard support for checkbox interactions
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 7.1, 8.2, 8.3_

- [ ] 6. Implement conversation interface
  - [~] 6.1 Create ConversationInput component
    - Create `src/components/ConversationInput.tsx` styled as voice transcription input
    - Disable submit when input is empty or AI is processing
    - Style with Corporate Trust input design (border-slate-200, rounded-lg, focus ring-2 ring-indigo-500)
    - Add ARIA labels and visible focus indicators
    - _Requirements: 3.1, 7.1, 8.2, 8.4_

  - [~] 6.2 Create MessageBubble and ConversationPanel components
    - Create `src/components/MessageBubble.tsx` with nurse/AI variants (different alignment and colors)
    - Create `src/components/ConversationPanel.tsx` displaying message history, structured notes, and follow-up questions
    - Show loading indicator during AI processing with simulated delay
    - _Requirements: 3.3, 3.5, 4.2, 4.5_

  - [~] 6.3 Create AIQuestions component
    - Create `src/components/AIQuestions.tsx` displaying follow-up questions in conversational format
    - Allow nurse to respond to each question with inline input
    - Wire responses through AI service to update structured notes
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 7. Implement summary generation and editing
  - [~] 7.1 Create SummaryEditor component
    - Create `src/components/SummaryEditor.tsx` with independently editable sections
    - Enable inline editing on section tap
    - Preserve edits immediately in state
    - Include finalize button (gradient primary style)
    - _Requirements: 5.1, 6.1, 6.2, 6.3, 6.4_

  - [~] 7.2 Wire summary generation into documentation flow
    - Add "Generate Summary" button to documentation view (visible when checklist has progress)
    - Call `mockAIService.generateSummary()` with session data
    - Display loading state during simulated delay
    - Transition to summary phase on completion
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 7.3 Write property tests for summary generation
    - **Property 8: Summary completeness** - summary references all notes and checked items
    - **Property 9: Summary structural validity** - non-empty sections with non-empty titles
    - **Property 10: Summary section edit round-trip** - editing and reading back yields exact content
    - **Validates: Requirements 5.1, 5.2, 5.3, 6.3**

- [~] 8. Checkpoint - Full flow verification
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Wire full documentation session together
  - [~] 9.1 Create DocumentationSession component
    - Create `src/components/DocumentationSession.tsx` composing SessionHeader, Checklist, ConversationPanel, and SummaryEditor on a single scrollable page
    - Add section headers and smooth scroll-behavior
    - Ensure single-page layout with all sections visible via scrolling
    - _Requirements: 2.3, 7.2, 7.5_

  - [~] 9.2 Implement full interaction flow wiring
    - Connect ConversationInput submit → AI processInput → update notes + auto-check items → display results
    - Connect follow-up question responses → AI processing → note updates
    - Connect Generate Summary → AI generateSummary → SummaryEditor display
    - Connect Finalize → mark summary as finalized, show confirmation
    - _Requirements: 3.2, 3.4, 4.4, 5.1, 6.4_

- [ ] 10. Accessibility and polish
  - [~] 10.1 Implement accessibility compliance
    - Add ARIA labels to all interactive elements
    - Implement keyboard navigation (Tab, Enter, Space) for all controls
    - Add visible focus indicators (ring-2 ring-indigo-500)
    - Implement ARIA live regions for AI processing status and error messages
    - Verify WCAG AA contrast ratios for all text against backgrounds
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 10.2 Write integration tests for full documentation flow
    - Test patient selection → checklist display → input → AI response → follow-up → summary → edit → finalize
    - Test accessibility with axe-core automated audit
    - Test touch target sizes (44px minimum)
    - _Requirements: 1.1, 1.2, 2.1, 3.2, 5.1, 6.4, 7.1, 8.1, 8.2_

- [~] 11. Final checkpoint - Complete app verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using `fast-check`
- Unit tests validate specific examples and edge cases
- The mock AI service is a separate module to support future replacement with real AI API
- All components use the Corporate Trust design system tokens defined in Tailwind config

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1", "2.2"] },
    { "id": 3, "tasks": ["2.3", "2.4", "4.1", "4.2"] },
    { "id": 4, "tasks": ["5.1", "6.1"] },
    { "id": 5, "tasks": ["6.2", "6.3"] },
    { "id": 6, "tasks": ["7.1", "7.2"] },
    { "id": 7, "tasks": ["7.3", "9.1"] },
    { "id": 8, "tasks": ["9.2"] },
    { "id": 9, "tasks": ["10.1"] },
    { "id": 10, "tasks": ["10.2"] }
  ]
}
```
