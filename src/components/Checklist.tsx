import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Check, Clock, Pencil, Plus } from 'lucide-react';
import type { ChecklistItem } from '@/types';
import type { ChecklistTemplate } from '@/data/checklists';
import { getTemplatesForCategory } from '@/data/checklists';

interface ChecklistProps {
  items: ChecklistItem[];
  onToggleItem: (itemId: string) => void;
  onAddItem: (item: ChecklistItem) => void;
  onUpdateResult: (itemId: string, result: string) => void;
  patientConditions: string[];
  patientId: string;
  completedCount: number;
  totalCount: number;
}

/**
 * Checklist displays patient-specific documentation items grouped by category.
 * Includes a progress indicator, toggleable checkbox cards with 44px+ touch
 * targets, per-category Add buttons with dropdowns, timestamp display on
 * checked items, and inline result inputs.
 */
export function Checklist({
  items,
  onToggleItem,
  onAddItem,
  onUpdateResult,
  patientConditions,
  patientId,
  completedCount,
  totalCount,
}: ChecklistProps) {
  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, ChecklistItem[]> = {};
    for (const item of items) {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    }
    return groups;
  }, [items]);

  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <section aria-label="Documentation checklist">
      {/* Progress indicator */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-2 gap-2">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">Checklist</h2>
          <span className="text-xs sm:text-sm font-medium text-slate-600 whitespace-nowrap">
            {completedCount} of {totalCount} completed
          </span>
        </div>
        <div
          className="h-2.5 w-full rounded-full bg-indigo-100 overflow-hidden"
          role="progressbar"
          aria-valuenow={completedCount}
          aria-valuemin={0}
          aria-valuemax={totalCount}
          aria-label={`Checklist progress: ${completedCount} of ${totalCount} items completed`}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Grouped checklist items */}
      <div className="space-y-4 sm:space-y-6">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <CategoryGroup
            key={category}
            category={category}
            items={categoryItems}
            onToggleItem={onToggleItem}
            onAddItem={onAddItem}
            onUpdateResult={onUpdateResult}
            patientConditions={patientConditions}
            patientId={patientId}
          />
        ))}
      </div>
    </section>
  );
}

// --- Category group with Add button ---

interface CategoryGroupProps {
  category: string;
  items: ChecklistItem[];
  onToggleItem: (itemId: string) => void;
  onAddItem: (item: ChecklistItem) => void;
  onUpdateResult: (itemId: string, result: string) => void;
  patientConditions: string[];
  patientId: string;
}

function CategoryGroup({
  category,
  items,
  onToggleItem,
  onAddItem,
  onUpdateResult,
  patientConditions,
  patientId,
}: CategoryGroupProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const templates = useMemo(
    () => getTemplatesForCategory(patientConditions, category),
    [patientConditions, category]
  );

  // Close dropdown on click outside
  useEffect(() => {
    if (!dropdownOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleSelectTemplate = useCallback(
    (template: ChecklistTemplate) => {
      const newItem: ChecklistItem = {
        id: `${template.id}-${Date.now()}`,
        patientId,
        category: template.category,
        label: template.label,
        description: template.description,
        isChecked: false,
      };
      onAddItem(newItem);
      setDropdownOpen(false);
    },
    [onAddItem, patientId]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          {category}
        </h3>
        {templates.length > 0 && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1 text-indigo-600 hover:bg-indigo-50 rounded-lg px-2 py-1 text-xs font-medium transition-colors"
              aria-label={`Add item to ${category}`}
              aria-expanded={dropdownOpen}
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Add
            </button>
            {dropdownOpen && (
              <div
                className="absolute right-0 top-full mt-1 z-20 w-64 bg-white rounded-lg border border-slate-200 shadow-lg py-1"
                role="menu"
              >
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    role="menuitem"
                    className="w-full text-left px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm text-slate-700 transition-colors"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <span className="font-medium">{template.label}</span>
                    <span className="block text-xs text-slate-500 mt-0.5">{template.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <ChecklistItemCard
            key={item.id}
            item={item}
            onToggle={onToggleItem}
            onUpdateResult={onUpdateResult}
          />
        ))}
      </div>
    </div>
  );
}

// --- Individual checklist item card ---

interface ChecklistItemCardProps {
  item: ChecklistItem;
  onToggle: (itemId: string) => void;
  onUpdateResult: (itemId: string, result: string) => void;
}

function ChecklistItemCard({ item, onToggle, onUpdateResult }: ChecklistItemCardProps) {
  const [resultDraft, setResultDraft] = useState(item.result ?? '');
  const [isEditing, setIsEditing] = useState(false); // only for editing existing results
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Sync draft when item.result changes externally
  useEffect(() => {
    setResultDraft(item.result ?? '');
  }, [item.result]);

  const handleSubmitResult = () => {
    const trimmed = resultDraft.trim();
    if (!trimmed) return;
    onUpdateResult(item.id, trimmed);
    // Auto-check the item if not already checked
    if (!item.isChecked) {
      onToggle(item.id);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmitResult();
    } else if (e.key === 'Escape') {
      setResultDraft(item.result ?? '');
      setIsEditing(false);
    }
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Determine if we show the input or the badge
  const showInput = !item.isChecked || isEditing;

  return (
    <div
      className={`
        flex items-start gap-3 min-h-[44px] p-3 sm:p-4 rounded-lg border
        transition-colors duration-150
        ${
          item.isChecked
            ? 'bg-indigo-50/30 border-indigo-200/60'
            : 'bg-white border-slate-100 shadow-sm'
        }
      `}
    >
      {/* Status indicator */}
      <div className="flex-shrink-0 mt-0.5 min-w-[24px] flex items-start justify-center pt-0.5">
        {item.isChecked ? (
          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-indigo-600 border-2 border-indigo-600">
            <Check className="w-4 h-4 text-white" aria-hidden="true" />
          </span>
        ) : (
          <span className="w-6 h-6 rounded-md border-2 border-dashed border-slate-300" aria-hidden="true" />
        )}
      </div>

      {/* Item content */}
      <div className="flex-1 min-w-0">
        <span
          className={`block text-sm font-semibold leading-tight ${
            item.isChecked ? 'text-slate-500' : 'text-slate-900'
          }`}
        >
          {item.label}
        </span>
        <span
          className={`block text-xs mt-0.5 leading-snug ${
            item.isChecked ? 'text-slate-500' : 'text-slate-600'
          }`}
        >
          {item.description}
        </span>

        {/* Timestamp display */}
        {item.isChecked && item.checkedAt && (
          <span className="flex items-center gap-1 text-xs text-indigo-500 mt-1">
            <Clock className="w-3 h-3" aria-hidden="true" />
            Completed at {formatTime(item.checkedAt)}
          </span>
        )}

        {/* Result input or badge */}
        <div className="mt-1.5">
          {showInput ? (
            <div className="flex items-center gap-1.5">
              <input
                ref={inputRef}
                type="text"
                value={resultDraft}
                onChange={(e) => setResultDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter result..."
                className="border border-slate-200 rounded-md px-2.5 py-1.5 text-xs flex-1 min-w-0 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                aria-label={`Result for ${item.label}`}
              />
              <button
                type="button"
                onClick={handleSubmitResult}
                disabled={!resultDraft.trim()}
                className="bg-indigo-600 text-white rounded-md px-2.5 py-1 text-xs font-medium min-h-[32px] hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label={isEditing ? `Save result for ${item.label}` : `Submit result for ${item.label}`}
              >
                {isEditing ? 'Save' : 'Submit'}
              </button>
            </div>
          ) : (
            item.result && (
              <div className="flex items-center gap-2">
                <span className="bg-indigo-50 text-indigo-700 rounded-md px-2 py-0.5 text-xs font-medium">
                  {item.result}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 transition-colors"
                  aria-label={`Edit result for ${item.label}`}
                >
                  <Pencil className="w-3 h-3" aria-hidden="true" />
                  Edit
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
