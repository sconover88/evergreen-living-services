/**
 * Simulated voice transcription data for the nursing notes app.
 * Keyed by patient condition — when a patient has multiple conditions,
 * observations referencing those conditions are interleaved.
 * Uses neutral "the resident / they / their" so scripts work for any patient.
 */
export const simulatedTranscriptions: Record<string, string[]> = {
  'Type 2 Diabetes': [
    "Checked the resident's blood glucose this morning, it was 142 which is a bit elevated from yesterday. They mentioned having some extra crackers last night before bed. I gave them the scheduled insulin dose at 7 AM, no issues with the injection site. Their feet look good, no redness or swelling.",
    "The resident's appetite has been good today. They ate about 75 percent of breakfast and all of lunch. Blood sugar before lunch was 118 which is within range. They mentioned feeling a little dizzy when standing up earlier but it passed quickly.",
    "Did the afternoon glucose check, it came back at 135. The resident seems in good spirits today. I noticed they've been drinking more water which is great. No signs of hypoglycemia throughout the shift.",
  ],
  'Hypertension': [
    "Took blood pressure at 8 AM, reading was 148 over 92 which is slightly above target. They took their lisinopril with breakfast. Heart rate was 76 and regular. They denied any headaches or dizziness. I'll recheck in about two hours.",
    "Follow-up blood pressure reading was 138 over 86, so it's coming down nicely after the medication. The resident has been resting comfortably. Reminded them about watching sodium intake at lunch today.",
    "End of shift BP check is 134 over 82 which is much better. Pulse is 72. The resident said they feel fine, no visual changes or headaches. Medication seems to be working well.",
  ],
  'Heart Failure': [
    "Weighed the resident this morning, they're at 187 pounds which is up 2 pounds from yesterday. Their ankles are showing some mild pitting edema, I'd say grade 1 plus. Oxygen sat is 94 percent on room air. They got their morning diuretic and I'm tracking intake and output closely.",
    "The resident is complaining of some shortness of breath when walking to the bathroom. Respiratory rate is 22 and SpO2 dropped to 91 with exertion. I elevated the head of bed and they're more comfortable now. Fluid intake so far is about 800 mL.",
    "Afternoon check, their breathing is better after rest. Urine output has been good since the Lasix, about 600 mL this shift. Edema in the ankles looks the same. They've been cooperative with fluid restrictions.",
  ],
  'COPD': [
    "The resident's respiratory rate this morning is 20 breaths per minute, pattern is regular. SpO2 is 93 percent on 2 liters nasal cannula. Gave the scheduled albuterol inhaler, technique looks good. Lung sounds have scattered wheezes in the bases bilaterally.",
    "Did breathing exercises with the resident this afternoon, they did pursed lip breathing for about 10 minutes. They coughed up some white mucus, small amount. Their O2 sat came up to 95 after the exercises. No increased dyspnea today.",
    "End of shift assessment, the resident's breath sounds are clearer than this morning. Respiratory rate is 18. They used their inhaler twice today as scheduled. No change in sputum. They're sleeping comfortably now.",
  ],
};
