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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
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
