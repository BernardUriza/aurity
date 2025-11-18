"use client";

/**
 * Policy Snapshot Page
 * Card: FI-UI-FEAT-204
 *
 * Displays effective policy configuration from fi.policy.yaml
 * Read-only view with global banner integration
 */

import { useEffect, useState } from "react";
import { GenericPolicyViewer } from "@/components/GenericPolicyViewer";
import { PageHeader } from "@/components/PageHeader";
import { policyHeader } from "@/config/page-headers";

interface PolicyResponse {
  policy: any;
  metadata?: {
    source?: string;
    version?: string;
    timestamp?: string;
  };
}

export default function PolicyPage() {
  const [data, setData] = useState<PolicyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch policy via Next.js API route (avoids CORS issues)
    fetch('/api/policy')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((responseData: PolicyResponse) => {
        setData(responseData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load policy:', err);
        setError(err.message || 'Unknown error');
        setLoading(false);
      });
  }, []);

  // Generate header config with metadata
  const headerConfig = policyHeader(
    data?.metadata
      ? {
          version: data.metadata.version,
          timestamp: data.metadata.timestamp,
          source: data.metadata.source,
        }
      : undefined
  );

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Page Header */}
      <PageHeader {...headerConfig} />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-purple-400 border-t-transparent rounded-full"></div>
            <span className="ml-3 text-slate-400">Loading policy...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-400 mb-2">Failed to Load Policy</h2>
            <p className="text-slate-300">{error}</p>
            <p className="text-sm text-slate-400 mt-4">
              Make sure <code className="text-red-400">config/fi.policy.yaml</code> exists and the backend is running.
            </p>
          </div>
        )}

        {/* Policy Viewer */}
        {!loading && !error && data && (
          <GenericPolicyViewer policy={data.policy} metadata={data.metadata} />
        )}
      </div>
    </div>
  );
}
