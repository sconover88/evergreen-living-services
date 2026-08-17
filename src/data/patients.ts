import type { Patient } from '@/types';

/**
 * Mock patient data representing residents in the senior living facility.
 * Each patient has unique conditions that determine their checklist items.
 */
export const mockPatients: Patient[] = [
  {
    id: 'p1',
    name: 'Margaret Thompson',
    room: '204A',
    age: 78,
    conditions: ['Type 2 Diabetes', 'Hypertension'],
    allergies: ['Penicillin'],
  },
  {
    id: 'p2',
    name: 'Robert Chen',
    room: '112B',
    age: 85,
    conditions: ['Heart Failure', 'COPD'],
    allergies: ['Sulfa drugs'],
  },
  {
    id: 'p3',
    name: 'Dorothy Williams',
    room: '308C',
    age: 82,
    conditions: ['Type 2 Diabetes', 'Heart Failure'],
    allergies: ['Aspirin', 'Latex'],
  },
  {
    id: 'p4',
    name: 'James Martinez',
    room: '215A',
    age: 74,
    conditions: ['COPD', 'Hypertension'],
    allergies: [],
  },
];
