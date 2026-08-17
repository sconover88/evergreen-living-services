import { useMemo } from 'react';
import { Check } from 'lucide-react';
import type { ChecklistItem } from '@/types';

interface ChecklistProps {
  items: ChecklistItem[];
  onToggleItem: (itemId: string) => void;
  completedCount: number;
  totalCount: number;
}

/**
 * Checklist displays patient-specific documentation items grouped by category.
 * Includes a progress indicator and toggleable checkbox cards with 44px+ touch
 * targets, keyboard support, and ARIA accessibility.
 */
export function Checklist({
  items,
  onToggleItem,
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
          <div key={category}>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2 sm:mb-3">
              {category}
            </h3>
            <div className="space-y-2">
              {categoryItems.map((item) => (
                <ChecklistItemCard
                  key={item.id}
                  item={item}
                  onToggle={onToggleItem}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// --- Individual checklist item card ---

interface ChecklistItemCardProps {
  item: ChecklistItem;
  onToggle: (itemId: string) => void;
}

function ChecklistItemCard({ item, onToggle }: ChecklistItemCardProps) {
  return (
    <label
      className={`
        flex items-start gap-3 min-h-[44px] p-3 sm:p-4 rounded-lg border cursor-pointer
        transition-colors duration-150
        ${
          item.isChecked
            ? 'bg-indigo-50/30 border-indigo-200/60'
            : 'bg-white border-slate-100 shadow-sm'
        }
        hover:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2
      `}
    >
      {/* Custom-styled checkbox */}
      <span className="flex-shrink-0 relative mt-0.5">
        <input
          type="checkbox"
          checked={item.isChecked}
          onChange={() => onToggle(item.id)}
          aria-label={`${item.label}: ${item.description}`}
          aria-checked={item.isChecked}
          className="sr-only peer"
        />
        <span
          aria-hidden="true"
          className={`
            flex items-center justify-center w-6 h-6 rounded-md border-2 transition-colors duration-150
            peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500 peer-focus-visible:ring-offset-2
            ${
              item.isChecked
                ? 'bg-indigo-600 border-indigo-600'
                : 'bg-white border-slate-300'
            }
          `}
        >
          {item.isChecked && (
            <Check className="w-4 h-4 text-white" aria-hidden="true" />
          )}
        </span>
      </span>

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
      </div>
    </label>
  );
}
