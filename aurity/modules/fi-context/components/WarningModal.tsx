'use client';

/**
 * FI-CONTEXT Module - Warning Modal Component
 *
 * Shows warning before destructive actions that could cause context loss
 * Part of no_context_loss policy
 */

import React from 'react';
import type { WarningModalProps } from '../types/context';

export const WarningModal: React.FC<WarningModalProps> = ({
  isOpen,
  action,
  onConfirm,
  onCancel,
  message,
}) => {
  if (!isOpen) return null;

  const defaultMessage = `You are about to ${action}. This action cannot be undone.`;

  return (
    <div className="warning-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="warning-modal bg-gray-900 border border-red-500 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="modal-header bg-red-900 bg-opacity-30 p-4 border-b border-red-500 flex items-center gap-3">
          <svg
            className="w-6 h-6 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-lg font-bold text-red-400">Context Loss Warning</h2>
        </div>

        {/* Content */}
        <div className="modal-content p-6 space-y-4">
          <div className="warning-icon-lg flex justify-center">
            <div className="w-16 h-16 rounded-full bg-red-900 bg-opacity-30 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          <div className="warning-message text-center">
            <p className="text-gray-200 text-base leading-relaxed">
              {message || defaultMessage}
            </p>
          </div>

          <div className="warning-details bg-gray-800 border border-gray-700 rounded p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">
              Free Intelligence Principle:
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              &quot;Una conversación infinita, nunca fragmentada.&quot;
              <br />
              <br />
              Your conversation context is sacred. This action will{' '}
              <span className="text-red-400 font-semibold">
                permanently erase your memory
              </span>
              . Consider using session history to revisit previous conversations
              instead.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="modal-actions p-4 border-t border-gray-700 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-medium transition-colors"
            autoFocus
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-medium transition-colors"
          >
            Confirm {action}
          </button>
        </div>
      </div>
    </div>
  );
};

WarningModal.displayName = 'WarningModal';
