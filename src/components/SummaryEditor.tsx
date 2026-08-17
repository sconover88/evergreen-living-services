import { useState, useRef, useEffect, useCallback } from 'react';
import { FileText, Pencil, CheckCircle, Save } from 'lucide-react';
import type { SummarySection } from '@/types';

interface SummaryEditorProps {
  sections: SummarySection[];
  onEditSection: (sectionId: string, newContent: string) => void;
  onFinalize: () => void;
  isFinalized: boolean;
}

/**
 * SummaryEditor displays the generated shift summary as a series of
 * independently editable section cards. Each section supports inline editing
 * on tap. A finalize button commits the summary for handoff.
 */
export function SummaryEditor({
  sections,
  onEditSection,
  onFinalize,
  isFinalized,
}: SummaryEditorProps) {
  return (
    <section aria-label="Shift summary editor">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4 sm:mb-6">
        <FileText className="w-5 h-5 text-indigo-600" aria-hidden="true" />
        <h2 className="text-base sm:text-lg font-semibold text-slate-900">Shift Summary</h2>
      </div>

      {/* Finalized success banner */}
      {isFinalized && (
        <div
          className="flex items-center gap-2 mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg"
          role="status"
          aria-live="polite"
        >
          <CheckCircle
            className="w-5 h-5 text-emerald-600 flex-shrink-0"
            aria-hidden="true"
          />
          <span className="text-sm font-medium text-emerald-800">
            Summary finalized successfully
          </span>
        </div>
      )}

      {/* Section cards */}
      <div className="space-y-4">
        {sections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            onEdit={onEditSection}
            isFinalized={isFinalized}
          />
        ))}
      </div>

      {/* Finalize button */}
      {!isFinalized && (
        <div className="mt-6 sm:mt-8">
          <button
            type="button"
            onClick={onFinalize}
            className="
              w-full flex items-center justify-center gap-2
              min-h-[44px] px-6 py-3
              bg-gradient-to-r from-indigo-600 to-violet-600 text-white
              font-semibold text-sm rounded-lg
              shadow-[0_4px_14px_0_rgba(79,70,229,0.3)]
              hover:-translate-y-0.5 hover:shadow-[0_6px_20px_0_rgba(79,70,229,0.4)]
              active:translate-y-0 active:shadow-[0_2px_8px_0_rgba(79,70,229,0.3)]
              transition-all duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
            "
            aria-label="Finalize shift summary"
          >
            <CheckCircle className="w-4.5 h-4.5" aria-hidden="true" />
            Finalize Summary
          </button>
        </div>
      )}
    </section>
  );
}

// --- Individual section card ---

interface SectionCardProps {
  section: SummarySection;
  onEdit: (sectionId: string, newContent: string) => void;
  isFinalized: boolean;
}

function SectionCard({ section, onEdit, isFinalized }: SectionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(section.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync local edit value when section content changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(section.content);
    }
  }, [section.content, isEditing]);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Place cursor at end
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    onEdit(section.id, editValue);
    setIsEditing(false);
  }, [onEdit, section.id, editValue]);

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      // Don't save on blur if the focus moved to the Save button
      const relatedTarget = e.relatedTarget as HTMLElement | null;
      if (relatedTarget?.dataset.saveButton) {
        return;
      }
      handleSave();
    },
    [handleSave]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Escape') {
        setEditValue(section.content);
        setIsEditing(false);
      }
    },
    [section.content]
  );

  return (
    <div
      className="
        bg-white rounded-xl border border-slate-100 p-4 sm:p-5
        shadow-[0_2px_8px_0_rgba(79,70,229,0.06)]
      "
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <h3 className="text-base sm:text-lg font-bold text-slate-900">{section.title}</h3>
        {!isFinalized && !isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="
              flex items-center justify-center
              min-w-[44px] min-h-[44px] p-2
              rounded-lg text-slate-400
              hover:text-indigo-600 hover:bg-indigo-50
              transition-colors duration-150
              focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
            "
            aria-label={`Edit ${section.title} section`}
          >
            <Pencil className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Content: view mode or edit mode */}
      {isEditing ? (
        <div className="space-y-3">
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="
              w-full min-h-[120px] p-3
              text-sm text-slate-700 leading-relaxed
              border border-indigo-200 rounded-lg
              ring-2 ring-indigo-500
              resize-y
              focus:outline-none
            "
            aria-label={`Editing ${section.title} content`}
          />
          <button
            type="button"
            data-save-button="true"
            onClick={handleSave}
            className="
              inline-flex items-center gap-1.5
              min-h-[44px] px-4 py-2
              text-sm font-medium
              text-indigo-700 bg-indigo-50 border border-indigo-200
              rounded-lg
              hover:bg-indigo-100
              transition-colors duration-150
              focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
            "
            aria-label={`Save changes to ${section.title}`}
          >
            <Save className="w-3.5 h-3.5" aria-hidden="true" />
            Save
          </button>
        </div>
      ) : (
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
          {section.content}
        </p>
      )}
    </div>
  );
}
