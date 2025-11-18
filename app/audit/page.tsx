/**
 * Free Intelligence - Audit Log Page
 *
 * /audit route - read-only view of system audit logs with filtering.
 *
 * File: apps/aurity/app/audit/page.tsx
 * Card: FI-UI-FEAT-206
 * Created: 2025-10-30
 */

"use client";

import { useState, useEffect } from "react";
import { AuditTable } from "../../components/AuditTable";
import { UserDisplay } from "../../components/UserDisplay";
import { getAuditLogs, getAuditOperations } from "../../lib/api/audit";
import type { AuditLogEntry, AuditOperation } from "../../types/audit";

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [operations, setOperations] = useState<AuditOperation[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<string>("24h");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const limit = 100;

  useEffect(() => {
    loadOperations();
    loadLogs();
  }, [selectedOperation, dateRange]);

  const loadOperations = async () => {
    try {
      const response = await getAuditOperations();
      setOperations(response.operations);
    } catch (err) {
      console.error("Failed to load operations:", err);
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getAuditLogs({
        limit,
        operation: selectedOperation === "ALL" ? undefined : selectedOperation,
      });
      setLogs(response.logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const handleOperationFilter = (operation: string) => {
    setSelectedOperation(operation);
  };

  const handleDateRangeFilter = (range: string) => {
    setDateRange(range);
  };

  const handleSelectLog = (log: AuditLogEntry) => {
    setSelectedLog(log);
  };

  const handleCloseDetail = () => {
    setSelectedLog(null);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-50">Audit Log</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-400">
              {logs.length} events {selectedOperation !== "ALL" && `(${selectedOperation})`}
            </div>
            <UserDisplay />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800 rounded-lg p-4 mb-6 flex flex-col sm:flex-row gap-4">
          {/* Operation Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Operation Type
            </label>
            <select
              value={selectedOperation}
              onChange={(e) => handleOperationFilter(e.target.value)}
              className="w-full bg-slate-700 text-slate-100 border border-slate-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Operations</option>
              {operations.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => handleDateRangeFilter(e.target.value)}
              className="w-full bg-slate-700 text-slate-100 border border-slate-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="custom">Custom range</option>
            </select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Audit Table */}
        {!loading && logs.length > 0 && (
          <AuditTable
            logs={logs}
            onSelectLog={handleSelectLog}
            selectedLog={selectedLog}
          />
        )}

        {/* Empty State */}
        {!loading && logs.length === 0 && (
          <div className="bg-slate-800 rounded-lg p-12 text-center">
            <p className="text-slate-400 text-lg">No audit logs found</p>
            <p className="text-slate-500 text-sm mt-2">
              Try adjusting your filters or check back later
            </p>
          </div>
        )}

        {/* Detail Modal */}
        {selectedLog && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={handleCloseDetail}
          >
            <div
              className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-slate-50">Event Detail</h2>
                <button
                  onClick={handleCloseDetail}
                  className="text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-slate-400">Audit ID</div>
                  <div className="text-slate-100 font-mono text-sm">{selectedLog.audit_id}</div>
                </div>

                <div>
                  <div className="text-sm text-slate-400">Timestamp</div>
                  <div className="text-slate-100">{new Date(selectedLog.timestamp).toLocaleString()}</div>
                </div>

                <div>
                  <div className="text-sm text-slate-400">Operation</div>
                  <div className="text-slate-100">{selectedLog.operation}</div>
                </div>

                <div>
                  <div className="text-sm text-slate-400">User</div>
                  <div className="text-slate-100">{selectedLog.user_id}</div>
                </div>

                <div>
                  <div className="text-sm text-slate-400">Endpoint</div>
                  <div className="text-slate-100 font-mono text-sm">{selectedLog.endpoint}</div>
                </div>

                <div>
                  <div className="text-sm text-slate-400">Status</div>
                  <div className={`inline-block px-2 py-1 rounded text-sm ${
                    selectedLog.status === "SUCCESS" ? "bg-green-900/30 text-green-400" :
                    selectedLog.status === "FAILED" ? "bg-red-900/30 text-red-400" :
                    "bg-yellow-900/30 text-yellow-400"
                  }`}>
                    {selectedLog.status}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-slate-400">Payload Hash</div>
                  <div className="text-slate-100 font-mono text-xs break-all">{selectedLog.payload_hash}</div>
                </div>

                <div>
                  <div className="text-sm text-slate-400">Result Hash</div>
                  <div className="text-slate-100 font-mono text-xs break-all">{selectedLog.result_hash}</div>
                </div>

                {selectedLog.metadata && selectedLog.metadata !== "{}" && (
                  <div>
                    <div className="text-sm text-slate-400 mb-2">Metadata</div>
                    <pre className="bg-slate-900 text-slate-300 p-3 rounded text-xs overflow-x-auto">
                      {JSON.stringify(JSON.parse(selectedLog.metadata), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
