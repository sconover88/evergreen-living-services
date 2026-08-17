import { Leaf } from 'lucide-react';
import { useSession } from '@/context/SessionContext';

export function Header() {
  const { state, resetSession } = useSession();

  return (
    <header className="bg-card border-b border-border px-4 sm:px-6 py-3 sm:py-4">
      <div className="mx-auto flex max-w-7xl flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
        <button
          onClick={resetSession}
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity duration-150"
          aria-label="Go to patient list"
        >
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
            <Leaf className="h-4 w-4 sm:h-5 sm:w-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-lg sm:text-xl font-bold text-transparent text-left">
              Evergreen Living Services
            </h1>
            <p className="hidden sm:block text-sm text-muted-foreground text-left">
              Nursing Documentation
            </p>
          </div>
        </button>

        {state.patient && (
          <div className="flex items-center gap-3 sm:gap-4 text-sm pl-12 sm:pl-0">
            <span className="font-medium text-foreground">
              {state.patient.name}
            </span>
            <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground">
              Room {state.patient.room}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
