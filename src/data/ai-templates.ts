/**
 * Templates and response data used by the mock AI service.
 * These provide realistic clinical language without requiring external API calls.
 */

/**
 * Follow-up question templates organized by condition.
 * The mock AI service selects relevant questions based on the patient's
 * conditions and which checklist items remain unchecked.
 */
export const followUpQuestionTemplates: Record<string, string[]> = {
  'Type 2 Diabetes': [
    'What was the blood glucose reading this shift?',
    'Was the insulin dose administered on schedule? Any adjustments needed?',
    'Did you notice any signs of hypoglycemia such as tremors or confusion?',
    'How was the patient\'s appetite today? Any changes to dietary intake?',
    'Were there any changes to the skin on the feet or lower extremities?',
    'Has the patient reported any numbness or tingling in the extremities?',
  ],
  'Hypertension': [
    'What was the most recent blood pressure reading?',
    'Did the patient report any headaches or dizziness today?',
    'Was the antihypertensive medication taken as scheduled?',
    'Have you discussed sodium intake with the patient today?',
    'Any visual disturbances or epistaxis reported?',
    'What was the resting heart rate?',
  ],
  'Heart Failure': [
    'What is today\'s weight compared to yesterday?',
    'Have you noticed any increase in peripheral edema?',
    'What is the current oxygen saturation reading?',
    'How is the patient\'s fluid balance — intake versus output?',
    'Has the patient reported any worsening shortness of breath?',
    'Was the diuretic effective? How was urine output this shift?',
    'Any orthopnea or paroxysmal nocturnal dyspnea reported?',
  ],
  'COPD': [
    'What is the current respiratory rate and pattern?',
    'What was the SpO2 reading? Is supplemental oxygen in use?',
    'Were inhaler treatments administered on schedule?',
    'How do the breath sounds compare to baseline?',
    'Did the patient complete breathing exercises today?',
    'Any change in sputum color, amount, or consistency?',
    'Has the patient reported increased dyspnea with activity?',
  ],
};

/**
 * Keywords that map nurse input to specific checklist item IDs.
 * The mock AI uses these to determine which checklist items
 * should be auto-checked when processing nurse input.
 */
export const keywordToChecklistMapping: Record<string, string[]> = {
  // Diabetes keywords
  'glucose': ['diabetes-1'],
  'blood sugar': ['diabetes-1'],
  'bg': ['diabetes-1'],
  'insulin': ['diabetes-2'],
  'injection': ['diabetes-2'],
  'feet': ['diabetes-3'],
  'foot': ['diabetes-3'],
  'toes': ['diabetes-3'],
  'diet': ['diabetes-4'],
  'meal': ['diabetes-4'],
  'ate': ['diabetes-4'],
  'food': ['diabetes-4'],
  'eating': ['diabetes-4'],
  'hypo': ['diabetes-5'],
  'shaky': ['diabetes-5'],
  'confused': ['diabetes-5'],
  'sweating': ['diabetes-5'],

  // Hypertension keywords
  'blood pressure': ['hyper-1'],
  'bp': ['hyper-1'],
  'systolic': ['hyper-1'],
  'diastolic': ['hyper-1'],
  'antihypertensive': ['hyper-2'],
  'lisinopril': ['hyper-2'],
  'amlodipine': ['hyper-2'],
  'headache': ['hyper-3'],
  'dizzy': ['hyper-3'],
  'dizziness': ['hyper-3'],
  'sodium': ['hyper-4'],
  'salt': ['hyper-4'],
  'heart rate': ['hyper-5'],
  'pulse': ['hyper-5'],
  'hr': ['hyper-5'],

  // Heart Failure keywords
  'weight': ['hf-1'],
  'weighed': ['hf-1'],
  'lbs': ['hf-1'],
  'kg': ['hf-1'],
  'fluid': ['hf-2'],
  'intake': ['hf-2'],
  'output': ['hf-2'],
  'i&o': ['hf-2'],
  'edema': ['hf-3'],
  'swelling': ['hf-3'],
  'ankles': ['hf-3'],
  'oxygen': ['hf-4'],
  'spo2': ['hf-4', 'copd-2'],
  'o2 sat': ['hf-4'],
  'saturation': ['hf-4'],
  'diuretic': ['hf-5'],
  'lasix': ['hf-5'],
  'furosemide': ['hf-5'],
  'breath': ['hf-6'],
  'dyspnea': ['hf-6'],
  'sob': ['hf-6'],
  'shortness': ['hf-6'],

  // COPD keywords
  'respiratory rate': ['copd-1'],
  'respirations': ['copd-1'],
  'rr': ['copd-1'],
  'breathing rate': ['copd-1'],
  'o2': ['copd-2'],
  'inhaler': ['copd-3'],
  'nebulizer': ['copd-3'],
  'albuterol': ['copd-3'],
  'lung sounds': ['copd-4'],
  'breath sounds': ['copd-4'],
  'wheezing': ['copd-4'],
  'crackles': ['copd-4'],
  'breathing exercise': ['copd-5'],
  'pursed lip': ['copd-5'],
  'diaphragmatic': ['copd-5'],
  'sputum': ['copd-6'],
  'cough': ['copd-6'],
  'mucus': ['copd-6'],
};

/**
 * Summary section titles used when generating shift summaries.
 * These represent the standard sections in a nurse-to-nurse handoff report.
 */
export const summarySectionTitles: string[] = [
  'Vital Signs',
  'Medications',
  'Patient Assessment',
  'Observations & Interventions',
  'Recommendations for Next Shift',
];

/**
 * Acknowledgment templates the mock AI uses to respond to nurse input.
 * Selected randomly to add conversational variety.
 */
export const acknowledgmentTemplates: string[] = [
  'Got it. I\'ve documented that information.',
  'Noted. I\'ve added this to the structured notes.',
  'Thank you. I\'ve captured those observations.',
  'Understood. I\'ve recorded that in the documentation.',
  'Documented. Let me know if there\'s anything else to add.',
  'I\'ve noted that. Anything else to report for this area?',
];

/**
 * Templates for generating structured note content from nurse input.
 * Keyed by checklist category to produce appropriately formatted clinical notes.
 */
export const noteTemplates: Record<string, string[]> = {
  'Vitals': [
    'Vital signs recorded: {content}.',
    'Assessment findings: {content}.',
    'Current reading: {content}.',
  ],
  'Medications': [
    'Medication administration: {content}.',
    'Pharmacological intervention: {content}.',
    'Medication compliance: {content}.',
  ],
  'Assessment': [
    'Clinical assessment: {content}.',
    'Physical assessment findings: {content}.',
    'Nursing assessment: {content}.',
  ],
  'Patient Communication': [
    'Patient reports: {content}.',
    'Patient education provided: {content}.',
    'Patient verbalized: {content}.',
  ],
};

/**
 * Template phrases used to construct summary section content.
 * The mock AI combines these with actual documented data to produce
 * realistic-sounding shift summaries.
 */
export const summaryPhraseTemplates: Record<string, string[]> = {
  'Vital Signs': [
    'Vital signs within acceptable parameters this shift.',
    'All scheduled vital sign measurements obtained and documented.',
    'No significant deviations from baseline vital signs noted.',
  ],
  'Medications': [
    'All scheduled medications administered as ordered.',
    'Medication regimen followed per physician orders.',
    'No adverse reactions to medications observed this shift.',
  ],
  'Patient Assessment': [
    'Patient assessed per standard of care.',
    'Overall condition stable compared to previous shift.',
    'No acute changes in clinical status noted.',
  ],
  'Observations & Interventions': [
    'Nursing interventions performed as indicated.',
    'Patient tolerated care without difficulty.',
    'Appropriate interventions initiated for findings noted.',
  ],
  'Recommendations for Next Shift': [
    'Continue current plan of care.',
    'Monitor for changes in condition and report as indicated.',
    'Continue routine assessments per care plan.',
  ],
};
