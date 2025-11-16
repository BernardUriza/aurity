"use client";

/**
 * Component Showcase Page
 *
 * Demonstrates all Aurity UI components with live examples.
 * Uses real component APIs with mock data.
 */

import { useState, useEffect } from "react";
import { AccessTile } from "@/components/AccessTile";
import { AuditTable } from "@/components/AuditTable";
import { KPICard } from "@/components/KPICard";
import { MetadataPanel } from "@/components/MetadataPanel";
import { PolicyViewer } from "@/components/PolicyViewer";
import { ServiceStatus } from "@/components/ServiceStatus";
import { SlimConversationCapture } from "@/components/SlimConversationCapture";
import { SplitView } from "@/components/SplitView";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { DemoConfigModal } from "@/components/demo-config-modal";
import { LANOnlyBanner } from "@/components/lan-only-banner";
import { JobLogsModal } from "@/components/JobLogsModal";
import {
  Activity,
  Users,
  FileText,
  TrendingUp,
  Database,
  Shield
} from "lucide-react";
import type { DemoConfig } from "@/lib/demo/types";
import type { NavRoute } from "@/lib/navigation";
import type { AuditLogEntry } from "@/types/audit";
import type { Interaction } from "@/types/interaction";

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7001';

export default function ShowcasePage() {
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [noSpoilers, setNoSpoilers] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDemoConfig, setShowDemoConfig] = useState(false);
  const [demoConfig, setDemoConfig] = useState<DemoConfig>({
    seed: "fi-2025",
    sessions: 24,
    eventsProfile: "mix",
    latencyMs: { min: 80, max: 300 },
    errorRatePct: 2
  });

  // Backend API Testing State
  const [transcriptionFile, setTranscriptionFile] = useState<File | null>(null);
  const [transcriptionResult, setTranscriptionResult] = useState<any>(null);
  const [transcriptionLoading, setTranscriptionLoading] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);

  const [diarizationFile, setDiarizationFile] = useState<File | null>(null);
  const [diarizationJobId, setDiarizationJobId] = useState<string | null>(null);
  const [diarizationStatus, setDiarizationStatus] = useState<any>(null);
  const [diarizationLoading, setDiarizationLoading] = useState(false);
  const [diarizationError, setDiarizationError] = useState<string | null>(null);

  const [soapResult, setSoapResult] = useState<any>(null);
  const [soapLoading, setSoapLoading] = useState(false);
  const [soapError, setSoapError] = useState<string | null>(null);

  const [completedJobs, setCompletedJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Logs modal state
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [selectedJobIdForLogs, setSelectedJobIdForLogs] = useState<string>('');

  // Backend API Functions
  const loadSampleAudio = async (url: string, fileName: string): Promise<File> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], fileName, { type: 'audio/mpeg' });
  };

  const handleTranscription = async () => {
    if (!transcriptionFile) return;

    console.log('[Transcription] Starting...', { fileName: transcriptionFile.name, size: transcriptionFile.size });
    setTranscriptionLoading(true);
    setTranscriptionError(null);
    setTranscriptionResult(null);
    setTranscriptionProgress(0);

    try {
      const formData = new FormData();
      formData.append('audio', transcriptionFile);

      console.log('[Transcription] Uploading file...');
      setTranscriptionProgress(25);

      // Generate UUID4 for session_id
      const sessionId = crypto.randomUUID();
      console.log('[Transcription] Generated session_id:', sessionId);

      const response = await fetch(`${API_BASE_URL}/api/workflows/aurity/consult`, {
        method: 'POST',
        body: formData,
        headers: {
          'X-Session-ID': sessionId
        }
      });

      console.log('[Transcription] Response received:', response.status);
      setTranscriptionProgress(50);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        console.error('[Transcription] Error:', errorData);
        throw new Error(errorData.detail || 'Transcription failed');
      }

      setTranscriptionProgress(75);
      const data = await response.json();
      console.log('[Transcription] Job started:', { job_id: data.job_id, status: data.status });

      setTranscriptionProgress(100);
      // For now, show job info instead of transcription text
      setTranscriptionResult({
        job_id: data.job_id,
        status: data.status,
        message: data.message,
        text: `Job started successfully! Job ID: ${data.job_id}\n\nUse the Diarization block to see full results with speaker separation.`
      });
    } catch (error: any) {
      console.error('[Transcription] Failed:', error);
      setTranscriptionError(error.message);
    } finally {
      setTranscriptionLoading(false);
      setTimeout(() => setTranscriptionProgress(0), 1000);
    }
  };

  const handleDiarization = async () => {
    if (!diarizationFile) return;

    console.log('[Diarization] Starting...', { fileName: diarizationFile.name, size: diarizationFile.size });
    setDiarizationLoading(true);
    setDiarizationError(null);
    setDiarizationJobId(null);
    setDiarizationStatus(null);

    try {
      const formData = new FormData();
      formData.append('audio', diarizationFile);

      console.log('[Diarization] Uploading file...');

      // Generate UUID4 for session_id
      const sessionId = crypto.randomUUID();
      console.log('[Diarization] Generated session_id:', sessionId);

      const response = await fetch(`${API_BASE_URL}/api/workflows/aurity/consult`, {
        method: 'POST',
        body: formData,
        headers: {
          'X-Session-ID': sessionId
        }
      });

      console.log('[Diarization] Upload response:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        console.error('[Diarization] Upload error:', errorData);
        throw new Error(errorData.detail || 'Diarization upload failed');
      }

      const data = await response.json();
      console.log('[Diarization] Job created:', data.job_id);
      setDiarizationJobId(data.job_id);

      // Start polling for status
      pollDiarizationStatus(data.job_id);
    } catch (error: any) {
      console.error('[Diarization] Failed:', error);
      setDiarizationError(error.message);
      setDiarizationLoading(false);
    }
  };

  const pollDiarizationStatus = async (jobId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/workflows/aurity/consult/${jobId}`);

      if (!response.ok) {
        console.error('[Diarization] Status fetch failed:', response.status);
        throw new Error('Failed to fetch job status');
      }

      const data = await response.json();
      console.log('[Diarization] Status update:', {
        status: data.status,
        progress: data.progress_pct,
        stages: data.stages
      });

      // Convert workflow status to diarization status format for UI
      setDiarizationStatus({
        job_id: data.job_id,
        status: data.status,
        progress_pct: data.progress_pct,
        stages: data.stages,
        soap_note: data.soap_note,
        error: data.error
      });

      // If job is still processing, poll again
      if (data.status === 'in_progress' || data.status === 'pending') {
        setTimeout(() => pollDiarizationStatus(jobId), 2000);
      } else {
        console.log('[Diarization] Job finished:', data.status);
        setDiarizationLoading(false);

        // Auto-load results if job completed successfully
        if (data.status === 'completed' && data.result_data) {
          console.log('[Diarization] Auto-loading results');
          setSoapResult(data.result_data);
        }
      }
    } catch (error: any) {
      console.error('[Diarization] Polling error:', error);
      setDiarizationError(error.message);
      setDiarizationLoading(false);
    }
  };

  const loadCompletedJobs = async () => {
    setLoadingJobs(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/workflows/aurity/consult?status_filter=completed`);
      if (response.ok) {
        const jobs = await response.json();
        setCompletedJobs(jobs);
        console.log('[Jobs] Loaded completed jobs:', jobs.length);
      }
    } catch (error) {
      console.error('[Jobs] Failed to load:', error);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleGenerateSOAP = async (retry: boolean = false) => {
    const jobId = selectedJobId || diarizationJobId;
    if (!jobId) return;

    console.log('[SOAP] Fetching results for job:', jobId, { retry });
    setSoapLoading(true);
    setSoapError(null);
    setSoapResult(null);

    try {
      // Add retry_soap=true query param if retry requested
      const url = `${API_BASE_URL}/api/workflows/aurity/consult/${jobId}${retry ? '?retry_soap=true' : ''}`;
      const response = await fetch(url);

      console.log('[SOAP] Response received:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        console.error('[SOAP] Fetch error:', errorData);
        throw new Error(errorData.detail || 'Failed to fetch results');
      }

      const data = await response.json();
      console.log('[SOAP] Success:', { hasData: !!data.result_data, soapStage: data.stages?.soap });

      if (data.result_data) {
        setSoapResult(data.result_data);
      } else {
        throw new Error('No result data available yet');
      }
    } catch (error: any) {
      console.error('[SOAP] Failed:', error);
      setSoapError(error.message);
    } finally {
      setSoapLoading(false);
    }
  };

  // Keepalive: Auto-refresh completed jobs from HDF5 every 5 seconds
  useEffect(() => {
    // Initial load
    loadCompletedJobs();

    // Set up polling interval
    const intervalId = setInterval(() => {
      loadCompletedJobs();
    }, 5000); // Poll every 5 seconds

    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []); // Empty dependency array = run once on mount

  // Mock data for AccessTile
  const mockRoutes: NavRoute[] = [
    {
      id: "sessions",
      title: "Sessions",
      description: "View all consultation sessions",
      href: "/sessions",
      icon: FileText,
      shortcut: "1"
    },
    {
      id: "dashboard",
      title: "Dashboard",
      description: "Analytics and KPIs",
      href: "/dashboard",
      icon: Activity,
      shortcut: "2"
    }
  ];

  // Mock data for AuditTable
  const mockAuditLogs: AuditLogEntry[] = [
    {
      audit_id: "audit_001",
      timestamp: "2025-11-08T23:00:00.000Z",
      operation: "LOGIN",
      user_id: "admin",
      endpoint: "/api/auth/login",
      status: "SUCCESS",
      metadata: JSON.stringify({ session_id: "session_123" })
    },
    {
      audit_id: "audit_002",
      timestamp: "2025-11-08T22:00:00.000Z",
      operation: "EXPORT",
      user_id: "coach_01",
      endpoint: "/api/export/timeline",
      status: "SUCCESS",
      metadata: JSON.stringify({ session_id: "session_124", format: "PDF" })
    },
    {
      audit_id: "audit_003",
      timestamp: "2025-11-08T21:00:00.000Z",
      operation: "DELETE",
      user_id: "admin",
      endpoint: "/api/sessions/delete",
      status: "BLOCKED",
      metadata: JSON.stringify({ reason: "Policy violation" })
    }
  ];

  // Mock data for MetadataPanel & SplitView
  const mockInteraction: Interaction = {
    interaction_id: "int_12345",
    session_id: "session_123",
    prompt: "# Patient Assessment\n\nPatient presents with:\n- Mild fever (38.2°C)\n- Headache\n- Fatigue\n\nGenerate SOAP note.",
    response: "## SOAP Note\n\n**Subjective:**\nPatient reports mild fever, headache, and fatigue for 2 days.\n\n**Objective:**\n- Temperature: 38.2°C\n- Alert and oriented\n\n**Assessment:**\nLikely viral syndrome\n\n**Plan:**\n- Rest and hydration\n- Monitor temperature\n- Return if symptoms worsen",
    provider: "ollama",
    model: "llama3.2",
    created_at: "2025-11-08T23:00:00.000Z",
    updated_at: "2025-11-08T23:00:00.000Z",
    content_hash: "sha256:abc123def456...",
    manifest_hash: "sha256:xyz789uvw012...",
    latency_ms: 234,
    tokens_in: 45,
    tokens_out: 120,
    metadata: {
      temperature: 0.7,
      top_p: 0.9
    }
  };

  // Mock data for PolicyViewer
  const mockPolicy = {
    sovereignty: {
      egress: {
        default: "deny",
        allowlist: ["ollama.local:11434", "localhost:*"]
      }
    },
    privacy: {
      phi: {
        enabled: false
      },
      redaction: {
        spoilers: true,
        style_file: "config/redaction.yaml"
      }
    },
    timeline: {
      auto: {
        enabled: true
      },
      auto_archive_days: 90
    },
    mutation: {
      append_only: true,
      event_required: true
    },
    export: {
      enabled: true,
      formats: ["PDF", "MD", "JSON"],
      manifest_required: true
    },
    retention: {
      audit_logs_days: 365,
      session_min_days: 30
    },
    security: {
      lan_only: true,
      auth_required: false
    },
    llm: {
      enabled: true,
      providers: ["ollama", "anthropic"],
      audit: {
        required: true
      }
    },
    observability: {
      chaos_drills_enabled: false
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-emerald-400" />
              <div>
                <h1 className="text-xl font-bold text-slate-50">Component Showcase</h1>
                <p className="text-xs text-slate-400">All Aurity UI components with live examples</p>
              </div>
            </div>
            <a
              href="/"
              className="px-4 py-2 bg-slate-800 text-slate-100 rounded hover:bg-slate-700 transition-colors"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

        {/* Backend API Testing */}
        <section className="border-2 border-purple-600/50 rounded-lg p-6 bg-purple-900/10">
          <h2 className="text-3xl font-bold mb-2 text-purple-300">Backend API Testing</h2>
          <p className="text-slate-400 mb-6">Test backend endpoints directly from the UI</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Transcription Block */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 relative">
              <button
                onClick={async () => {
                  const file = await loadSampleAudio('/samples/transcription-sample.mp3', 'sample-patient.mp3');
                  setTranscriptionFile(file);
                }}
                className="absolute top-4 right-4 px-3 py-1 text-xs bg-emerald-600/20 border border-emerald-600/50 text-emerald-300 rounded hover:bg-emerald-600/30 transition-colors"
              >
                Use Sample
              </button>
              <h3 className="text-xl font-semibold mb-4 text-emerald-400">Transcription</h3>
              <p className="text-sm text-slate-400 mb-4">Upload audio file to get transcription</p>

              <div className="space-y-4">
                {/* Audio Player */}
                {transcriptionFile && (
                  <div className="p-3 bg-slate-900 rounded border border-slate-700">
                    <p className="text-xs text-slate-400 mb-2">Preview Audio:</p>
                    <audio
                      controls
                      className="w-full"
                      src={URL.createObjectURL(transcriptionFile)}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Audio File
                  </label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setTranscriptionFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-slate-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded file:border-0
                      file:text-sm file:font-semibold
                      file:bg-emerald-600 file:text-white
                      hover:file:bg-emerald-700
                      file:cursor-pointer cursor-pointer"
                  />
                  {transcriptionFile && (
                    <p className="mt-2 text-xs text-slate-500">
                      Selected: {transcriptionFile.name} ({Math.round(transcriptionFile.size / 1024)} KB)
                    </p>
                  )}
                </div>

                <button
                  onClick={handleTranscription}
                  disabled={!transcriptionFile || transcriptionLoading}
                  className="w-full px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {transcriptionLoading ? 'Transcribing...' : 'Transcribe'}
                </button>

                {/* Progress Bar */}
                {transcriptionProgress > 0 && (
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                      style={{ width: `${transcriptionProgress}%` }}
                    />
                  </div>
                )}

                {transcriptionError && (
                  <div className="p-3 bg-red-900/30 border border-red-800 rounded text-red-400 text-sm">
                    Error: {transcriptionError}
                  </div>
                )}

                {transcriptionResult && (
                  <div className="p-4 bg-slate-900 rounded border border-slate-700 max-h-96 overflow-y-auto">
                    <h4 className="text-sm font-semibold text-slate-300 mb-2">Result:</h4>
                    <p className="text-sm text-slate-400 mb-2">
                      Language: <span className="text-emerald-400">{transcriptionResult.language}</span>
                    </p>
                    <p className="text-sm text-slate-400 mb-2">
                      Duration: <span className="text-emerald-400">{transcriptionResult.duration}s</span>
                    </p>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap mt-4">
                      {transcriptionResult.text}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Diarization Block */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 relative">
              <button
                onClick={async () => {
                  const file = await loadSampleAudio('/samples/diarization-sample.mp3', 'sample-consultation.mp3');
                  setDiarizationFile(file);
                }}
                className="absolute top-4 right-4 px-3 py-1 text-xs bg-blue-600/20 border border-blue-600/50 text-blue-300 rounded hover:bg-blue-600/30 transition-colors"
              >
                Use Sample
              </button>
              <h3 className="text-xl font-semibold mb-4 text-blue-400">Diarization</h3>
              <p className="text-sm text-slate-400 mb-4">Upload audio for speaker separation</p>

              <div className="space-y-4">
                {/* Audio Player */}
                {diarizationFile && (
                  <div className="p-3 bg-slate-900 rounded border border-slate-700">
                    <p className="text-xs text-slate-400 mb-2">Preview Audio:</p>
                    <audio
                      controls
                      className="w-full"
                      src={URL.createObjectURL(diarizationFile)}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Audio File
                  </label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setDiarizationFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-slate-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-600 file:text-white
                      hover:file:bg-blue-700
                      file:cursor-pointer cursor-pointer"
                  />
                  {diarizationFile && (
                    <p className="mt-2 text-xs text-slate-500">
                      Selected: {diarizationFile.name} ({Math.round(diarizationFile.size / 1024)} KB)
                    </p>
                  )}
                </div>

                <button
                  onClick={handleDiarization}
                  disabled={!diarizationFile || diarizationLoading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {diarizationLoading ? 'Processing...' : 'Upload & Process'}
                </button>

                {diarizationError && (
                  <div className="p-3 bg-red-900/30 border border-red-800 rounded text-red-400 text-sm">
                    Error: {diarizationError}
                  </div>
                )}

                {diarizationJobId && (
                  <div className="p-3 bg-blue-900/30 border border-blue-800 rounded text-blue-300 text-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        Job ID: <span className="font-mono">{diarizationJobId}</span>
                      </div>
                      <button
                        onClick={() => pollDiarizationStatus(diarizationJobId)}
                        disabled={diarizationLoading}
                        className="ml-4 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors"
                      >
                        🔄 Refresh
                      </button>
                    </div>
                  </div>
                )}

                {diarizationStatus && (
                  <div className="p-4 bg-slate-900 rounded border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-slate-300">Status:</h4>
                      {(diarizationStatus.status === 'in_progress' || diarizationStatus.status === 'pending') && (
                        <span className="text-xs text-blue-400 animate-pulse">● Auto-refreshing...</span>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-slate-400">
                        Status: <span className={`font-semibold ${
                          diarizationStatus.status === 'completed' ? 'text-green-400' :
                          diarizationStatus.status === 'in_progress' ? 'text-yellow-400' :
                          diarizationStatus.status === 'failed' ? 'text-red-400' :
                          'text-slate-400'
                        }`}>{diarizationStatus.status}</span>
                      </p>
                      <p className="text-slate-400">
                        Progress: <span className="text-blue-400">{diarizationStatus.progress_pct}%</span>
                      </p>

                      {/* Display workflow stages */}
                      {diarizationStatus.stages && (
                        <div className="mt-3 space-y-1">
                          <p className="text-xs font-semibold text-slate-400 mb-1">Workflow Stages:</p>
                          {Object.entries(diarizationStatus.stages).map(([stage, status]: [string, any]) => (
                            <p key={stage} className="text-xs text-slate-400">
                              {stage}: <span className={`font-semibold ${
                                status === 'completed' ? 'text-green-400' :
                                status === 'processing' ? 'text-yellow-400' :
                                status === 'pending' ? 'text-slate-500' :
                                status === 'failed' ? 'text-red-400' :
                                'text-slate-400'
                              }`}>{status}</span>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Legacy chunks display (for backward compatibility) */}
                    {diarizationStatus.chunks && diarizationStatus.chunks.length > 0 && (
                      <div className="mt-4 max-h-64 overflow-y-auto space-y-2">
                        <h5 className="text-xs font-semibold text-slate-400 mb-2">Transcription Chunks:</h5>
                        {diarizationStatus.chunks.map((chunk: any, idx: number) => (
                          <div key={idx} className="p-2 bg-slate-800 rounded text-xs">
                            <p className="text-slate-500">
                              [{chunk.start_time.toFixed(1)}s - {chunk.end_time.toFixed(1)}s]
                              <span className="ml-2 text-purple-400">{chunk.speaker}</span>
                            </p>
                            <p className="text-slate-300 mt-1">{chunk.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* SOAP Extraction Block */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 relative">
              <div className="absolute top-4 right-4 flex gap-2">
                <div className="px-3 py-1 text-xs bg-emerald-600/20 border border-emerald-600/50 text-emerald-300 rounded flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Live (5s)
                </div>
                <div className="px-3 py-1 text-xs bg-amber-600/20 border border-amber-600/50 text-amber-300 rounded">
                  Auto-enabled
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-amber-400">SOAP Extraction</h3>
              <p className="text-sm text-slate-400 mb-4">Generate SOAP note from diarization job • Auto-refreshing every 5s</p>

              <div className="space-y-4">
                {/* Collapsible Job Selector */}
                <details className="group" onToggle={(e) => {
                  if ((e.target as HTMLDetailsElement).open && completedJobs.length === 0) {
                    loadCompletedJobs();
                  }
                }}>
                  <summary className="cursor-pointer p-3 bg-amber-900/20 border border-amber-800/50 rounded text-amber-300 text-sm flex items-center justify-between hover:bg-amber-900/30 transition-colors">
                    <span>📋 Browse completed jobs from HDF5</span>
                    <span className="group-open:rotate-180 transition-transform">▼</span>
                  </summary>

                  <div className="mt-2 p-3 bg-slate-900 rounded border border-slate-700 max-h-64 overflow-y-auto">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-slate-400">
                        {completedJobs.length > 0
                          ? `${completedJobs.length} completed jobs found`
                          : 'Loading from HDF5 storage...'}
                      </p>
                      <button
                        onClick={loadCompletedJobs}
                        disabled={loadingJobs}
                        className="px-3 py-1 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 disabled:bg-slate-700 transition-colors"
                      >
                        {loadingJobs ? 'Loading...' : '🔄 Refresh'}
                      </button>
                    </div>

                    {loadingJobs ? (
                      <p className="text-xs text-slate-400 text-center py-4 animate-pulse">Loading jobs from HDF5...</p>
                    ) : completedJobs.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">No completed jobs found</p>
                    ) : (
                      <div className="space-y-2">
                        {completedJobs.map((job: any) => {
                          const hasSoap = job.result_data?.soap_note || job.result_data?.soap_status === 'completed';
                          const soapProcessing = job.result_data?.soap_status === 'processing';

                          return (
                            <div
                              key={job.job_id}
                              className={`p-2 rounded border transition-colors ${
                                selectedJobId === job.job_id
                                  ? 'bg-amber-900/30 border-amber-600'
                                  : 'bg-slate-800 border-slate-700 hover:border-amber-800'
                              }`}
                            >
                              <button
                                onClick={() => {
                                  setSelectedJobId(job.job_id);
                                  // Auto-load job data when selected
                                  setTimeout(async () => {
                                    try {
                                      const response = await fetch(`${API_BASE_URL}/api/workflows/aurity/consult/${job.job_id}`);
                                      if (response.ok) {
                                        const data = await response.json();
                                        setDiarizationStatus(data);
                                        if (data.result_data) {
                                          setSoapResult(data.result_data);
                                        }
                                      }
                                    } catch (error) {
                                      console.error('[Job Select] Failed to load job data:', error);
                                    }
                                  }, 100);
                                }}
                                className="w-full text-left"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-slate-300">{job.job_id.slice(0, 8)}...</span>
                                    {hasSoap && (
                                      <span className="px-2 py-0.5 text-xs bg-green-900/40 text-green-400 border border-green-700/50 rounded">
                                        ✓ SOAP
                                      </span>
                                    )}
                                    {soapProcessing && (
                                      <span className="px-2 py-0.5 text-xs bg-yellow-900/40 text-yellow-400 border border-yellow-700/50 rounded animate-pulse">
                                        ⏳ Generating
                                      </span>
                                    )}
                                    {!hasSoap && !soapProcessing && (
                                      <span className="px-2 py-0.5 text-xs bg-slate-700/40 text-slate-400 border border-slate-600/50 rounded">
                                        ○ No SOAP
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-slate-500">{new Date(job.created_at).toLocaleString()}</span>
                                </div>
                                <div className="text-xs text-slate-400 mt-1">
                                  Size: {Math.round(job.audio_file_size / 1024)}KB
                                </div>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedJobIdForLogs(job.job_id);
                                  setLogsModalOpen(true);
                                }}
                                className="mt-2 w-full px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors"
                                aria-label="View logs"
                              >
                                View Logs
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </details>

                {/* Selected Job Display */}
                {selectedJobId && (
                  <div className="p-2 bg-amber-900/20 border border-amber-800/50 rounded text-xs text-amber-300">
                    Selected: <span className="font-mono">{selectedJobId}</span>
                  </div>
                )}

                {/* Action buttons based on SOAP status */}
                {diarizationStatus && diarizationStatus.status === 'completed' && diarizationStatus.result_data && (
                  <>
                    {/* Case 1: SOAP already generated - Load Results */}
                    {(diarizationStatus.result_data.soap_note || diarizationStatus.result_data.soap_status === 'completed') && (
                      <button
                        onClick={handleGenerateSOAP}
                        disabled={soapLoading}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        {soapLoading ? 'Loading...' : '✓ Load Results (SOAP Generated)'}
                      </button>
                    )}

                    {/* Case 2: SOAP generation in progress (with retry button if stuck) */}
                    {diarizationStatus.result_data.soap_status === 'processing' && !diarizationStatus.result_data.soap_note && (
                      <div className="space-y-2">
                        <div className="p-3 bg-yellow-900/30 border border-yellow-800 rounded text-yellow-400 text-sm animate-pulse">
                          ⏳ SOAP generation in progress... (will be available shortly)
                        </div>
                        <button
                          onClick={() => handleGenerateSOAP(true)}
                          disabled={soapLoading}
                          className="w-full px-3 py-1.5 bg-amber-600/80 text-white text-sm rounded hover:bg-amber-700 disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors"
                        >
                          {soapLoading ? 'Retrying...' : '🔄 Retry SOAP Generation'}
                        </button>
                      </div>
                    )}

                    {/* Case 3: No SOAP yet or Failed - Generate/Retry SOAP */}
                    {!diarizationStatus.result_data.soap_note &&
                     diarizationStatus.result_data.soap_status !== 'processing' &&
                     diarizationStatus.result_data.soap_status !== 'completed' && (
                      <button
                        onClick={() => handleGenerateSOAP(diarizationStatus.result_data.soap_status === 'failed')}
                        disabled={soapLoading}
                        className="w-full px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        {soapLoading ? 'Generating...' : (diarizationStatus.result_data.soap_status === 'failed' ? '🔄 Retry SOAP Generation' : '🔬 Generate SOAP Note')}
                      </button>
                    )}
                  </>
                )}

                {/* Show status message if job is not ready */}
                {diarizationStatus && diarizationStatus.status !== 'completed' && (
                  <div className="p-3 bg-yellow-900/30 border border-yellow-800 rounded text-yellow-400 text-sm">
                    ⏳ Job still processing ({diarizationStatus.progress_pct}%). Results will be available when completed.
                  </div>
                )}

                {diarizationStatus?.status === 'completed' && !diarizationStatus?.result_data && (
                  <div className="p-3 bg-red-900/30 border border-red-800 rounded text-red-400 text-sm">
                    ❌ Job completed but no results available. This may indicate an error during processing.
                  </div>
                )}

                {soapError && (
                  <div className="p-3 bg-red-900/30 border border-red-800 rounded text-red-400 text-sm">
                    Error: {soapError}
                  </div>
                )}

                {/* Show SplitView when there's result_data (transcription/diarization), regardless of SOAP */}
                {(() => {
                  const resultData = soapResult || diarizationStatus?.result_data;
                  if (!resultData) return null;

                  return (
                    <div className="space-y-4">
                      {/* Info Header */}
                      {resultData.transcription && (
                        <div className="p-3 bg-slate-900 rounded border border-slate-700">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>
                              <span className="font-semibold">Language:</span> {resultData.transcription.language}
                            </span>
                            <span>
                              <span className="font-semibold">Duration:</span> {resultData.transcription.duration}s
                            </span>
                            <span>
                              <span className="font-semibold">Segments:</span> {resultData.diarization?.segments?.length || 0}
                            </span>
                          </div>
                        </div>
                      )}

                    {/* No Spoilers Toggle */}
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          checked={noSpoilers}
                          onChange={(e) => setNoSpoilers(e.target.checked)}
                          className="rounded"
                        />
                        <span>No Spoilers Mode</span>
                      </label>
                    </div>

                      {/* SplitView with Transcription and SOAP */}
                      <SplitView
                        interaction={{
                          interaction_id: selectedJobId || diarizationJobId || 'unknown',
                          session_id: selectedJobId || diarizationJobId || 'unknown',
                          prompt: resultData.diarization?.segments?.map((seg: any, idx: number) =>
                            `[${seg.start_time.toFixed(1)}s - ${seg.end_time.toFixed(1)}s] ${seg.speaker}:\n${seg.text}`
                          ).join('\n\n') || 'No transcription available',
                          response: (() => {
                            // Format SOAP note if available
                            const soapNote = resultData.soap_note || diarizationStatus?.result_data?.soap_note;
                            if (!soapNote) return '';

                            return `# SOAP Note

## S — Subjetivo (Subjective)
**Motivo de consulta:** ${soapNote.subjetivo?.motivo_consulta || 'N/A'}

**Síntomas:**
${soapNote.subjetivo?.sintomas?.map((s: any) => `- ${s.sintoma} (${s.duracion || 'N/A'})`).join('\n') || 'N/A'}

## O — Objetivo (Objective)
**Signos vitales:**
${soapNote.objetivo?.signos_vitales ? Object.entries(soapNote.objetivo.signos_vitales).map(([k, v]) => `- ${k}: ${v}`).join('\n') : 'N/A'}

## A — Análisis (Assessment)
**Impresión diagnóstica:** ${soapNote.analisis?.impresion_diagnostica || 'N/A'}

**Diagnósticos diferenciales:**
${soapNote.analisis?.diagnosticos_diferenciales?.map((dx: any) => `- ${dx.condicion}`).join('\n') || 'N/A'}

## P — Plan (Treatment)
**Seguimiento:** ${soapNote.plan?.seguimiento?.proxima_cita || 'N/A'}

**Tratamiento:**
${soapNote.plan?.tratamiento_farmacologico?.map((med: string) => `- ${med}`).join('\n') || 'N/A'}

---
**Completeness Score:** ${soapNote.completeness ? soapNote.completeness.toFixed(0) : 0}%`;
                          })(),
                          provider: 'whisper',
                          model: resultData.transcription?.language === 'es' ? 'faster-whisper-small' : 'whisper-small',
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                          content_hash: 'sha256:live-result',
                          metadata: {
                            duration: resultData.transcription?.duration,
                            language: resultData.transcription?.language,
                            segments_count: resultData.diarization?.segments?.length
                          }
                        }}
                        noSpoilers={noSpoilers}
                        onCopyPrompt={() => {
                          const text = resultData.diarization?.segments?.map((seg: any) =>
                            `[${seg.start_time.toFixed(1)}s - ${seg.end_time.toFixed(1)}s] ${seg.speaker}:\n${seg.text}`
                          ).join('\n\n') || '';
                          navigator.clipboard.writeText(text);
                        }}
                        onCopyResponse={() => {
                          const soapNote = resultData.soap_note || diarizationStatus?.result_data?.soap_note;
                          if (!soapNote) return;

                          const text = `# SOAP Note

## S — Subjetivo
Motivo: ${soapNote.subjetivo?.motivo_consulta || 'N/A'}
Síntomas: ${soapNote.subjetivo?.sintomas?.map((s: any) => s.sintoma).join(', ') || 'N/A'}

## O — Objetivo
${soapNote.objetivo?.signos_vitales ? JSON.stringify(soapNote.objetivo.signos_vitales, null, 2) : 'N/A'}

## A — Análisis
${soapNote.analisis?.impresion_diagnostica || 'N/A'}

## P — Plan
${soapNote.plan?.seguimiento?.proxima_cita || 'N/A'}`;

                          navigator.clipboard.writeText(text);
                        }}
                      />

                    {/* SOAP Note Display (if available) */}
                    {diarizationStatus?.soap_note && (
                      <div className="mt-6 p-6 bg-emerald-900/20 border border-emerald-700/50 rounded-lg">
                        <h4 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                          <span>📋</span> SOAP Note (Medical Extraction)
                        </h4>

                        <div className="space-y-4">
                          {/* Subjetivo */}
                          <div>
                            <h5 className="text-sm font-bold text-emerald-300 mb-2">S — Subjetivo (Chief Complaint)</h5>
                            <div className="text-sm text-slate-300 bg-slate-900/50 p-3 rounded">
                              <p className="font-medium">{diarizationStatus.soap_note.subjetivo?.motivo_consulta || 'N/A'}</p>
                              {diarizationStatus.soap_note.subjetivo?.historia_actual && (
                                <p className="mt-2 text-slate-400">{diarizationStatus.soap_note.subjetivo.historia_actual}</p>
                              )}
                            </div>
                          </div>

                          {/* Objetivo */}
                          <div>
                            <h5 className="text-sm font-bold text-blue-300 mb-2">O — Objetivo (Vital Signs & Exam)</h5>
                            <div className="text-sm text-slate-300 bg-slate-900/50 p-3 rounded">
                              {diarizationStatus.soap_note.objetivo?.signos_vitales && (
                                <div className="grid grid-cols-2 gap-2">
                                  {diarizationStatus.soap_note.objetivo.signos_vitales.presion_arterial && (
                                    <p>BP: {diarizationStatus.soap_note.objetivo.signos_vitales.presion_arterial}</p>
                                  )}
                                  {diarizationStatus.soap_note.objetivo.signos_vitales.frecuencia_cardiaca && (
                                    <p>HR: {diarizationStatus.soap_note.objetivo.signos_vitales.frecuencia_cardiaca} bpm</p>
                                  )}
                                  {diarizationStatus.soap_note.objetivo.signos_vitales.temperatura && (
                                    <p>Temp: {diarizationStatus.soap_note.objetivo.signos_vitales.temperatura}°C</p>
                                  )}
                                </div>
                              )}
                              {diarizationStatus.soap_note.objetivo?.exploracion_fisica?.aspecto && (
                                <p className="mt-2 text-slate-400">{diarizationStatus.soap_note.objetivo.exploracion_fisica.aspecto}</p>
                              )}
                            </div>
                          </div>

                          {/* Analisis */}
                          <div>
                            <h5 className="text-sm font-bold text-amber-300 mb-2">A — Análisis (Diagnosis)</h5>
                            <div className="text-sm text-slate-300 bg-slate-900/50 p-3 rounded">
                              {diarizationStatus.soap_note.analisis?.diagnostico_principal?.condicion && (
                                <p className="font-medium text-amber-200">
                                  {diarizationStatus.soap_note.analisis.diagnostico_principal.condicion}
                                  {diarizationStatus.soap_note.analisis.diagnostico_principal.cie10 && (
                                    <span className="ml-2 text-xs text-slate-500">({diarizationStatus.soap_note.analisis.diagnostico_principal.cie10})</span>
                                  )}
                                </p>
                              )}
                              {diarizationStatus.soap_note.analisis?.diagnosticos_diferenciales?.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-slate-500 mb-1">Differential:</p>
                                  <ul className="list-disc list-inside text-slate-400 text-xs space-y-1">
                                    {diarizationStatus.soap_note.analisis.diagnosticos_diferenciales.map((dx: any, idx: number) => (
                                      <li key={idx}>{dx.condicion}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Plan */}
                          <div>
                            <h5 className="text-sm font-bold text-violet-300 mb-2">P — Plan (Treatment)</h5>
                            <div className="text-sm text-slate-300 bg-slate-900/50 p-3 rounded">
                              {diarizationStatus.soap_note.plan?.seguimiento?.proxima_cita && (
                                <p className="text-slate-400">Follow-up: {diarizationStatus.soap_note.plan.seguimiento.proxima_cita}</p>
                              )}
                              {diarizationStatus.soap_note.plan?.tratamiento_farmacologico?.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-slate-500 mb-1">Medications:</p>
                                  <ul className="list-disc list-inside text-slate-400 text-xs">
                                    {diarizationStatus.soap_note.plan.tratamiento_farmacologico.map((med: any, idx: number) => (
                                      <li key={idx}>{med}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Completeness Score */}
                          {diarizationStatus.soap_note.completeness !== undefined && (
                            <div className="mt-4 pt-4 border-t border-emerald-800/50">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400">SOAP Completeness Score</span>
                                <span className="text-sm font-bold text-emerald-400">{diarizationStatus.soap_note.completeness.toFixed(0)}%</span>
                              </div>
                              <div className="mt-2 w-full bg-slate-700 rounded-full h-2">
                                <div
                                  className="bg-emerald-500 h-2 rounded-full transition-all"
                                  style={{ width: `${diarizationStatus.soap_note.completeness}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                      {/* Raw JSON (collapsible) */}
                      <details className="mt-4">
                        <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300">
                          Show raw JSON
                        </summary>
                        <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono mt-2 max-h-96 overflow-y-auto">
                          {JSON.stringify(resultData, null, 2)}
                        </pre>
                      </details>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Jobs List Block */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 relative">
              <div className="absolute top-4 right-4 px-3 py-1 text-xs bg-violet-600/20 border border-violet-600/50 text-violet-300 rounded">
                Live Data
              </div>
              <h3 className="text-xl font-semibold mb-4 text-violet-400">Jobs Monitor</h3>
              <p className="text-sm text-slate-400 mb-4">View all diarization jobs</p>

              <button
                onClick={async () => {
                  try {
                    const response = await fetch(`${API_BASE_URL}/internal/diarization/jobs`);
                    const data = await response.json();
                    alert(`Found ${data.data.length} jobs\n\n${JSON.stringify(data.data, null, 2)}`);
                  } catch (error: any) {
                    alert('Error: ' + error.message);
                  }
                }}
                className="w-full px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700 transition-colors font-medium"
              >
                Fetch All Jobs
              </button>

              <div className="mt-4 p-3 bg-violet-900/20 border border-violet-800/50 rounded text-violet-300 text-xs">
                Click to fetch and display all jobs in an alert dialog
              </div>
            </div>

          </div>
        </section>

        {/* KPI Cards */}
        <section>
          <h2 className="text-3xl font-bold mb-2 text-slate-50">KPI Cards</h2>
          <p className="text-slate-400 mb-6">Display key performance indicators with trends</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total Sessions"
              value={1247}
              status="success"
              trend="up"
              description="+12% vs last month"
              icon={<FileText className="h-5 w-5" />}
              target="1500"
            />
            <KPICard
              title="Active Coaches"
              value={23}
              status="neutral"
              trend="stable"
              description="No change"
              icon={<Users className="h-5 w-5" />}
            />
            <KPICard
              title="Avg Response Time"
              value={234}
              unit="ms"
              status="success"
              trend="down"
              description="Faster than target"
              icon={<Activity className="h-5 w-5" />}
              target="<300ms"
            />
            <KPICard
              title="Storage Usage"
              value={78}
              unit="%"
              status="warning"
              trend="up"
              description="Approaching capacity"
              icon={<Database className="h-5 w-5" />}
              target="<80%"
            />
          </div>
        </section>

        {/* Access Tiles */}
        <section>
          <h2 className="text-3xl font-bold mb-2 text-slate-50">Access Tiles</h2>
          <p className="text-slate-400 mb-6">Navigation cards with keyboard shortcuts</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockRoutes.map(route => (
              <AccessTile key={route.id} route={route} />
            ))}
          </div>
        </section>

        {/* Service Status */}
        <section>
          <h2 className="text-3xl font-bold mb-2 text-slate-50">Service Status</h2>
          <p className="text-slate-400 mb-6">Monitor backend service health</p>
          <ServiceStatus
            services={{
              backend: { ok: true, latency_ms: 45 },
              diarization: { whisper: true, ffmpeg: true },
              llm: { ollama: true, models: ["llama3.2"] },
              policy: true
            }}
          />
        </section>

        {/* LAN Only Banner */}
        <section>
          <h2 className="text-3xl font-bold mb-2 text-slate-50">LAN Only Banner</h2>
          <p className="text-slate-400 mb-6">Security notice for local network access</p>
          <LANOnlyBanner />
        </section>

        {/* Demo Config Modal */}
        <section>
          <h2 className="text-3xl font-bold mb-2 text-slate-50">Demo Config Modal</h2>
          <p className="text-slate-400 mb-6">Configure demo dataset parameters</p>
          <button
            onClick={() => setShowDemoConfig(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            Open Demo Config
          </button>
          <DemoConfigModal
            isOpen={showDemoConfig}
            onClose={() => setShowDemoConfig(false)}
            currentConfig={demoConfig}
            onApply={(config) => {
              setDemoConfig(config);
              console.log('Demo config updated:', config);
            }}
          />
        </section>

        {/* Onboarding Flow */}
        <section>
          <h2 className="text-3xl font-bold mb-2 text-slate-50">Onboarding Flow</h2>
          <p className="text-slate-400 mb-6">3-phase onboarding experience</p>
          <button
            onClick={() => setShowOnboarding(true)}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
          >
            Launch Onboarding Flow
          </button>
          {showOnboarding && (
            <div className="fixed inset-0 z-50 bg-slate-900">
              <button
                onClick={() => setShowOnboarding(false)}
                className="absolute top-4 right-4 px-4 py-2 bg-slate-800 text-slate-100 rounded hover:bg-slate-700 transition z-10"
              >
                Close Onboarding
              </button>
              <OnboardingFlow />
            </div>
          )}
        </section>

        {/* Audit Table */}
        <section>
          <h2 className="text-3xl font-bold mb-2 text-slate-50">Audit Table</h2>
          <p className="text-slate-400 mb-6">View system audit logs with filtering</p>
          <AuditTable
            logs={mockAuditLogs}
            onSelectLog={setSelectedLog}
            selectedLog={selectedLog}
          />
          {selectedLog && (
            <div className="mt-4 p-4 bg-slate-800 rounded-lg">
              <h3 className="font-semibold text-slate-100 mb-2">Selected Log Details</h3>
              <pre className="text-xs text-slate-300 overflow-auto">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>
          )}
        </section>

        {/* Metadata Panel */}
        <section>
          <h2 className="text-3xl font-bold mb-2 text-slate-50">Metadata Panel</h2>
          <p className="text-slate-400 mb-6">Display interaction metadata and performance metrics</p>
          <MetadataPanel interaction={mockInteraction} />
        </section>

        {/* Slim Conversation Capture */}
        <section>
          <h2 className="text-3xl font-bold mb-2 text-slate-50">Conversation Capture</h2>
          <p className="text-slate-400 mb-6">Audio recording interface for consultations</p>
          <div className="max-w-2xl">
            <SlimConversationCapture
              onAudioCaptured={(blob) => {
                console.log('Audio captured:', blob.size, 'bytes');
              }}
            />
          </div>
        </section>

        {/* Policy Viewer */}
        <section>
          <h2 className="text-3xl font-bold mb-2 text-slate-50">Policy Viewer</h2>
          <p className="text-slate-400 mb-6">Display system policy configuration</p>
          <PolicyViewer
            policy={mockPolicy}
            metadata={{
              source: "config/fi.policy.yaml",
              version: "1.0.0",
              timestamp: "2025-11-08T23:00:00.000Z"
            }}
          />
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/95 backdrop-blur mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-16 text-sm text-slate-400">
            <span>Aurity Framework v0.1.0 · Component Showcase</span>
          </div>
        </div>
      </footer>

      {/* Job Logs Modal */}
      <JobLogsModal
        jobId={selectedJobIdForLogs}
        isOpen={logsModalOpen}
        onClose={() => setLogsModalOpen(false)}
      />
    </div>
  );
}
