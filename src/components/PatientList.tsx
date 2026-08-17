import { User, MapPin, Activity, AlertTriangle } from 'lucide-react';
import type { Patient } from '@/types';

interface PatientListProps {
  patients: Patient[];
  onSelectPatient: (patientId: string) => void;
}

/**
 * PatientList displays a grid of patient cards for nurse selection.
 * Styled with the Corporate Trust design system: elevated cards,
 * indigo-tinted shadows, hover lift effects, and 44px+ touch targets.
 */
export function PatientList({ patients, onSelectPatient }: PatientListProps) {
  return (
    <section aria-label="Patient list">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">
        Select a Patient
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {patients.map((patient) => (
          <button
            key={patient.id}
            type="button"
            onClick={() => onSelectPatient(patient.id)}
            aria-label={`Select patient ${patient.name}, Room ${patient.room}`}
            className="w-full min-h-[44px] text-left bg-white rounded-xl border border-slate-100 p-4 sm:p-6 shadow-[0_4px_20px_-2px_rgba(79,70,229,0.1)] hover:shadow-[0_10px_25px_-5px_rgba(79,70,229,0.15)] hover:-translate-y-1 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-11 h-11 rounded-full bg-indigo-50 flex items-center justify-center">
                <User className="w-5 h-5 text-indigo-600" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-slate-900 truncate">
                  {patient.name}
                </h3>
                <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                    Room {patient.room}
                  </span>
                  <span>Age {patient.age}</span>
                </div>

                {/* Conditions */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Activity
                    className="w-3.5 h-3.5 text-indigo-500"
                    aria-hidden="true"
                  />
                  {patient.conditions.map((condition) => (
                    <span
                      key={condition}
                      className="bg-indigo-50 text-indigo-600 rounded-full px-3 py-1 text-xs font-medium"
                    >
                      {condition}
                    </span>
                  ))}
                </div>

                {/* Allergies */}
                {patient.allergies.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <AlertTriangle
                      className="w-3.5 h-3.5 text-red-500"
                      aria-hidden="true"
                    />
                    {patient.allergies.map((allergy) => (
                      <span
                        key={allergy}
                        className="bg-red-50 text-red-600 rounded-full px-3 py-1 text-xs font-medium"
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
