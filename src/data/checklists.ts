import type { ChecklistItem } from '@/types';

/**
 * Checklist item templates organized by patient condition.
 * When a documentation session starts, the app merges templates
 * for all of a patient's conditions to build their complete checklist.
 *
 * Note: The `patientId` field is set to empty string in templates
 * and must be populated when generating a patient-specific checklist.
 */

export interface ChecklistTemplate {
  id: string;
  category: string;
  label: string;
  description: string;
}

const diabetesChecklist: ChecklistTemplate[] = [
  {
    id: 'diabetes-1',
    category: 'Vitals',
    label: 'Blood glucose level',
    description: 'Measure and record fasting or pre-meal blood glucose',
  },
  {
    id: 'diabetes-2',
    category: 'Medications',
    label: 'Insulin administered',
    description: 'Confirm insulin dose administered per physician orders',
  },
  {
    id: 'diabetes-3',
    category: 'Assessment',
    label: 'Foot inspection',
    description: 'Inspect feet for sores, redness, swelling, or skin breakdown',
  },
  {
    id: 'diabetes-4',
    category: 'Patient Communication',
    label: 'Dietary intake reviewed',
    description: 'Document meals consumed and any deviations from diabetic diet',
  },
  {
    id: 'diabetes-5',
    category: 'Assessment',
    label: 'Hypoglycemia signs assessment',
    description: 'Check for shakiness, confusion, sweating, or dizziness',
  },
];

const hypertensionChecklist: ChecklistTemplate[] = [
  {
    id: 'hyper-1',
    category: 'Vitals',
    label: 'Blood pressure reading',
    description: 'Measure blood pressure in seated position after 5 minutes rest',
  },
  {
    id: 'hyper-2',
    category: 'Medications',
    label: 'Antihypertensive medication given',
    description: 'Confirm scheduled blood pressure medication administered',
  },
  {
    id: 'hyper-3',
    category: 'Assessment',
    label: 'Headache or dizziness check',
    description: 'Ask about headache, dizziness, or visual changes',
  },
  {
    id: 'hyper-4',
    category: 'Patient Communication',
    label: 'Sodium intake counseling',
    description: 'Review dietary sodium intake and reinforce low-salt guidelines',
  },
  {
    id: 'hyper-5',
    category: 'Vitals',
    label: 'Heart rate recorded',
    description: 'Measure and record resting heart rate',
  },
];

const heartFailureChecklist: ChecklistTemplate[] = [
  {
    id: 'hf-1',
    category: 'Vitals',
    label: 'Daily weight',
    description: 'Weigh patient same time, same scale — report gain > 2 lbs/day',
  },
  {
    id: 'hf-2',
    category: 'Assessment',
    label: 'Fluid intake and output',
    description: 'Document total fluid intake and urine output for the shift',
  },
  {
    id: 'hf-3',
    category: 'Assessment',
    label: 'Edema check',
    description: 'Assess lower extremities for pitting edema (grade 1-4)',
  },
  {
    id: 'hf-4',
    category: 'Vitals',
    label: 'Oxygen saturation',
    description: 'Record SpO2 level — notify MD if below 92%',
  },
  {
    id: 'hf-5',
    category: 'Medications',
    label: 'Diuretic administered',
    description: 'Confirm diuretic given per schedule and document response',
  },
  {
    id: 'hf-6',
    category: 'Patient Communication',
    label: 'Dyspnea assessment',
    description: 'Ask about shortness of breath at rest and with exertion',
  },
];

const copdChecklist: ChecklistTemplate[] = [
  {
    id: 'copd-1',
    category: 'Vitals',
    label: 'Respiratory rate',
    description: 'Count respirations for full minute — note rhythm and depth',
  },
  {
    id: 'copd-2',
    category: 'Vitals',
    label: 'Oxygen saturation',
    description: 'Record SpO2 — maintain target range per physician order',
  },
  {
    id: 'copd-3',
    category: 'Medications',
    label: 'Inhaler use documented',
    description: 'Confirm scheduled inhaler treatments administered and technique observed',
  },
  {
    id: 'copd-4',
    category: 'Assessment',
    label: 'Breath sounds auscultated',
    description: 'Listen to lung sounds in all fields — note wheezes, crackles, diminished',
  },
  {
    id: 'copd-5',
    category: 'Patient Communication',
    label: 'Breathing exercise participation',
    description: 'Document pursed-lip or diaphragmatic breathing exercise completion',
  },
  {
    id: 'copd-6',
    category: 'Assessment',
    label: 'Sputum characteristics',
    description: 'Note color, amount, and consistency of any sputum produced',
  },
];

/**
 * Condition-to-checklist-template mapping.
 * Keys must match the condition strings used in Patient.conditions.
 */
export const checklistTemplates: Record<string, ChecklistTemplate[]> = {
  'Type 2 Diabetes': diabetesChecklist,
  'Hypertension': hypertensionChecklist,
  'Heart Failure': heartFailureChecklist,
  'COPD': copdChecklist,
};

/**
 * Generates a complete checklist for a given patient by merging templates
 * for all of their conditions. Sets `patientId` and initializes state fields.
 */
export function buildChecklistForPatient(patientId: string, conditions: string[]): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  for (const condition of conditions) {
    const templates = checklistTemplates[condition];
    if (!templates) continue;

    for (const template of templates) {
      items.push({
        id: template.id,
        patientId,
        category: template.category,
        label: template.label,
        description: template.description,
        isChecked: false,
      });
    }
  }

  return items;
}


/**
 * Returns all checklist templates for a given category, filtered by patient conditions.
 * Used to populate the "Add" dropdown in each category section.
 */
export function getTemplatesForCategory(conditions: string[], category: string): ChecklistTemplate[] {
  const templates: ChecklistTemplate[] = [];

  for (const condition of conditions) {
    const conditionTemplates = checklistTemplates[condition];
    if (!conditionTemplates) continue;

    for (const template of conditionTemplates) {
      if (template.category === category) {
        // Avoid duplicates (same id already added from another condition)
        if (!templates.some((t) => t.id === template.id)) {
          templates.push(template);
        }
      }
    }
  }

  return templates;
}
