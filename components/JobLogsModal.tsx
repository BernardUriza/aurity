'use client';

import { useState, useEffect } from 'react';
import { getDiarizationJobLogs, type JobLogEntry } from '@/lib/api/diarization';

interface JobLogsModalProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function JobLogsModal({ jobId, isOpen, onClose }: JobLogsModalProps) {
  const [logs, setLogs] = useState<JobLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && jobId) {
      loadLogs();
    }
  }, [isOpen, jobId]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedLogs = await getDiarizationJobLogs(jobId);
      setLogs(fetchedLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (logId: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'denied':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Job Logs
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {jobId.substring(0, 16)}...
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading logs...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No logs found for this job
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.log_id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-blue-300 dark:hover:border-blue-600 transition-all"
                >
                  {/* Log Header */}
                  <div
                    className="p-4 bg-gray-50 dark:bg-gray-700/50 cursor-pointer"
                    onClick={() => toggleExpand(log.log_id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded border ${getResultColor(
                            log.result
                          )}`}
                        >
                          {log.result.toUpperCase()}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {log.action}
                        </span>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                          expandedLogs.has(log.log_id) ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                      <span>
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      <span>User: {log.user_id}</span>
                    </div>
                  </div>

                  {/* Expandable Details */}
                  {expandedLogs.has(log.log_id) && (
                    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Log ID:</span>
                            <p className="text-gray-600 dark:text-gray-400 font-mono text-xs break-all">
                              {log.log_id}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Resource:</span>
                            <p className="text-gray-600 dark:text-gray-400 text-xs break-all">
                              {log.resource}
                            </p>
                          </div>
                        </div>

                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="mt-3">
                            <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">Details:</span>
                            <pre className="mt-2 bg-gray-100 dark:bg-gray-900 rounded p-3 text-xs overflow-x-auto text-gray-800 dark:text-gray-200">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {logs.length} {logs.length === 1 ? 'entry' : 'entries'} found
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
