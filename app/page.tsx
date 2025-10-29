// =============================================================================
// AURITY FRAMEWORK - Home Page
// =============================================================================
// Next.js 14 home page
// Sprint: SPR-2025W44
// Version: 0.1.0
// =============================================================================

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Aurity Framework
        </h1>
        <p className="text-xl text-center text-gray-600 mb-12">
          Free Intelligence - Data Sovereignty Framework
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          <a
            href="/timeline"
            className="group rounded-lg border border-blue-500 bg-blue-50 px-5 py-4 transition-colors hover:border-blue-600 hover:bg-blue-100"
          >
            <h2 className="mb-3 text-2xl font-semibold text-blue-900">
              Timeline ⭐{' '}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                →
              </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm text-blue-700">
              FI-UI-FEAT-100: SessionHeader - Encabezado contextual con policy badges
            </p>
          </a>

          <a
            href="/viewer"
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100"
          >
            <h2 className="mb-3 text-2xl font-semibold">
              Viewer{' '}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                →
              </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              FI-UI-FEAT-002: InteractionViewer - Split view con markdown y metadata
            </p>
          </a>

          <a
            href="/context-demo"
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100"
          >
            <h2 className="mb-3 text-2xl font-semibold">
              Context Demo{' '}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                →
              </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              FI-UI-FEAT-003: No Context Loss Policy - Auto-save y recovery
            </p>
          </a>

          <a
            href="/dashboard"
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100"
          >
            <h2 className="mb-3 text-2xl font-semibold">
              Dashboard{' '}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                →
              </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Session timeline and corpus analytics from local HDF5 storage
            </p>
          </a>

          <a
            href="/triage"
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100"
          >
            <h2 className="mb-3 text-2xl font-semibold">
              Triage Intake{' '}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                →
              </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Patient triage and intake management with AI-powered transcription
            </p>
          </a>

          <a
            href="/api/health"
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100"
          >
            <h2 className="mb-3 text-2xl font-semibold">
              API Health{' '}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                →
              </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              System health check and status monitoring
            </p>
          </a>
        </div>

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Sprint: SPR-2025W44 | Version: 0.1.0</p>
          <p className="mt-2">NO PHI - All data is synthetic for demo purposes</p>
        </div>
      </div>
    </main>
  );
}
