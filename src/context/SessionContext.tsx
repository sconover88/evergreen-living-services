import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from 'react';

import type {
  ConversationMessage,
  DocumentationSessionState,
  Patient,
  ShiftSummary,
  StructuredNote,
} from '@/types';
import { buildChecklistForPatient } from '@/data/checklists';
import { mockPatients } from '@/data/patients';

// --- Action types ---

type SessionAction =
  | { type: 'SELECT_PATIENT'; patientId: string }
  | { type: 'TOGGLE_CHECKLIST_ITEM'; itemId: string }
  | { type: 'ADD_MESSAGE'; message: ConversationMessage }
  | { type: 'ADD_NOTES'; notes: StructuredNote[] }
  | { type: 'AUTO_CHECK_ITEMS'; itemIds: string[] }
  | { type: 'SET_SUMMARY'; summary: ShiftSummary }
  | { type: 'EDIT_SUMMARY_SECTION'; sectionId: string; content: string }
  | { type: 'FINALIZE_SUMMARY' }
  | { type: 'SET_PROCESSING'; isProcessing: boolean };

// --- Initial state ---

const initialState: DocumentationSessionState = {
  patient: null,
  checklist: [],
  messages: [],
  structuredNotes: [],
  summary: null,
  isProcessing: false,
  phase: 'patient-selection',
};

// --- Reducer ---

function sessionReducer(
  state: DocumentationSessionState,
  action: SessionAction
): DocumentationSessionState {
  switch (action.type) {
    case 'SELECT_PATIENT': {
      const patient = mockPatients.find((p) => p.id === action.patientId);
      if (!patient) return state;

      const checklist = buildChecklistForPatient(patient.id, patient.conditions);

      return {
        ...initialState,
        patient,
        checklist,
        phase: 'documentation',
      };
    }

    case 'TOGGLE_CHECKLIST_ITEM': {
      return {
        ...state,
        checklist: state.checklist.map((item) =>
          item.id === action.itemId
            ? {
                ...item,
                isChecked: !item.isChecked,
                checkedAt: !item.isChecked ? Date.now() : undefined,
              }
            : item
        ),
      };
    }

    case 'ADD_MESSAGE': {
      return {
        ...state,
        messages: [...state.messages, action.message],
      };
    }

    case 'ADD_NOTES': {
      return {
        ...state,
        structuredNotes: [...state.structuredNotes, ...action.notes],
      };
    }

    case 'AUTO_CHECK_ITEMS': {
      const now = Date.now();
      return {
        ...state,
        checklist: state.checklist.map((item) =>
          action.itemIds.includes(item.id) && !item.isChecked
            ? { ...item, isChecked: true, checkedAt: now }
            : item
        ),
      };
    }

    case 'SET_SUMMARY': {
      return {
        ...state,
        summary: action.summary,
        phase: 'summary',
      };
    }

    case 'EDIT_SUMMARY_SECTION': {
      if (!state.summary) return state;

      return {
        ...state,
        summary: {
          ...state.summary,
          sections: state.summary.sections.map((section) =>
            section.id === action.sectionId
              ? { ...section, content: action.content }
              : section
          ),
        },
      };
    }

    case 'FINALIZE_SUMMARY': {
      if (!state.summary) return state;

      return {
        ...state,
        summary: {
          ...state.summary,
          finalized: true,
        },
      };
    }

    case 'SET_PROCESSING': {
      return {
        ...state,
        isProcessing: action.isProcessing,
      };
    }

    default:
      return state;
  }
}

// --- Context ---

interface SessionContextValue {
  state: DocumentationSessionState;
  dispatch: React.Dispatch<SessionAction>;
  patients: Patient[];
  selectPatient: (patientId: string) => void;
  toggleChecklistItem: (itemId: string) => void;
  addMessage: (message: ConversationMessage) => void;
  addNotes: (notes: StructuredNote[]) => void;
  autoCheckItems: (itemIds: string[]) => void;
  setSummary: (summary: ShiftSummary) => void;
  editSummarySection: (sectionId: string, content: string) => void;
  finalizeSummary: () => void;
  setProcessing: (isProcessing: boolean) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

// --- Provider ---

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  const selectPatient = useCallback(
    (patientId: string) => {
      dispatch({ type: 'SELECT_PATIENT', patientId });
    },
    [dispatch]
  );

  const toggleChecklistItem = useCallback(
    (itemId: string) => {
      dispatch({ type: 'TOGGLE_CHECKLIST_ITEM', itemId });
    },
    [dispatch]
  );

  const addMessage = useCallback(
    (message: ConversationMessage) => {
      dispatch({ type: 'ADD_MESSAGE', message });
    },
    [dispatch]
  );

  const addNotes = useCallback(
    (notes: StructuredNote[]) => {
      dispatch({ type: 'ADD_NOTES', notes });
    },
    [dispatch]
  );

  const autoCheckItems = useCallback(
    (itemIds: string[]) => {
      dispatch({ type: 'AUTO_CHECK_ITEMS', itemIds });
    },
    [dispatch]
  );

  const setSummary = useCallback(
    (summary: ShiftSummary) => {
      dispatch({ type: 'SET_SUMMARY', summary });
    },
    [dispatch]
  );

  const editSummarySection = useCallback(
    (sectionId: string, content: string) => {
      dispatch({ type: 'EDIT_SUMMARY_SECTION', sectionId, content });
    },
    [dispatch]
  );

  const finalizeSummary = useCallback(() => {
    dispatch({ type: 'FINALIZE_SUMMARY' });
  }, [dispatch]);

  const setProcessing = useCallback(
    (isProcessing: boolean) => {
      dispatch({ type: 'SET_PROCESSING', isProcessing });
    },
    [dispatch]
  );

  const value: SessionContextValue = {
    state,
    dispatch,
    patients: mockPatients,
    selectPatient,
    toggleChecklistItem,
    addMessage,
    addNotes,
    autoCheckItems,
    setSummary,
    editSummarySection,
    finalizeSummary,
    setProcessing,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

// --- Hook ---

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within an AppProvider');
  }
  return context;
}

// --- Exports for testing ---

export { sessionReducer, initialState };
export type { SessionAction };
