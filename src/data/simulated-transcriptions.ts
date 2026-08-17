/**
 * Simulated voice transcription data for the nursing notes app.
 * Keyed by patient condition — when a patient has multiple conditions,
 * observations referencing those conditions are selected.
 */
export const simulatedTranscriptions: Record<string, string[]> = {
  'Type 2 Diabetes': [
    "Checked Margaret's blood glucose this morning, it was 142 which is a bit elevated from yesterday. She said she had some extra crackers last night before bed. I gave her the scheduled insulin dose at 7 AM, no issues with the injection site. Her feet look good, no redness or swelling.",
    "Margaret's appetite has been good today. She ate about 75 percent of her breakfast and all of her lunch. Blood sugar before lunch was 118 which is within range. She mentioned feeling a little dizzy when she stood up earlier but it passed quickly.",
    "Did the afternoon glucose check, it came back at 135. Margaret seems in good spirits today. I noticed she's been drinking more water which is great. No signs of hypoglycemia throughout the shift.",
  ],
  'Hypertension': [
    "Took blood pressure at 8 AM, reading was 148 over 92 which is slightly above her target. She took her lisinopril with breakfast. Heart rate was 76 and regular. She denied any headaches or dizziness. I'll recheck in about two hours.",
    "Follow-up blood pressure reading was 138 over 86, so it's coming down nicely after the medication. She's been resting comfortably. Reminded her about watching the sodium in her lunch today.",
    "End of shift BP check is 134 over 82 which is much better. Pulse is 72. Margaret said she feels fine, no visual changes or headaches. Medication seems to be working well.",
  ],
  'Heart Failure': [
    "Weighed Robert this morning, he's at 187 pounds which is up 2 pounds from yesterday. His ankles are showing some mild pitting edema, I'd say grade 1 plus. Oxygen sat is 94 percent on room air. He got his morning diuretic and I'm tracking his intake and output closely.",
    "Robert is complaining of some shortness of breath when walking to the bathroom. His respiratory rate is 22 and SpO2 dropped to 91 with exertion. I elevated the head of bed and he's more comfortable now. Fluid intake so far is about 800 mL.",
    "Afternoon check on Robert, his breathing is better after rest. Urine output has been good since the Lasix, about 600 mL this shift. Edema in the ankles looks the same. He's been cooperative with fluid restrictions.",
  ],
  'COPD': [
    "Robert's respiratory rate this morning is 20 breaths per minute, pattern is regular. SpO2 is 93 percent on 2 liters nasal cannula. Gave his scheduled albuterol inhaler, technique looks good. Lung sounds have scattered wheezes in the bases bilaterally.",
    "Did breathing exercises with Robert this afternoon, he did pursed lip breathing for about 10 minutes. He coughed up some white mucus, small amount. His O2 sat came up to 95 after the exercises. No increased dyspnea today.",
    "End of shift assessment, Robert's breath sounds are clearer than this morning. Respiratory rate is 18. He used his inhaler twice today as scheduled. No change in sputum. He's sleeping comfortably now.",
  ],
};
