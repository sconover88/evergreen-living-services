import { AppProvider, useSession } from '@/context/SessionContext';
import { Header } from '@/components/Header';
import { PatientList } from '@/components/PatientList';
import { DocumentationSession } from '@/components/DocumentationSession';

function AppContent() {
  const { state, patients, selectPatient } = useSession();

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Skip to main content link for keyboard/screen reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <Header />
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {state.phase === 'patient-selection' && (
          <PatientList patients={patients} onSelectPatient={selectPatient} />
        )}
        {(state.phase === 'documentation' || state.phase === 'summary') && (
          <DocumentationSession />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
