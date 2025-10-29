// =============================================================================
// TriageIntakeForm Component
// =============================================================================
// Form for capturing triage intake with conversation recording
// Sprint: SPR-2025W44
// Version: 0.1.0
// =============================================================================

'use client';

import React, { useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import {
  SlimConversationCapture,
  ConversationSession,
  TranscriptionSegment,
} from '@/components/SlimConversationCapture';
import { useAuth } from '@/lib/useAuth';

interface TriageIntakeFormProps {
  darkMode?: boolean;
}

interface TriageFormData {
  reason: string;
  symptoms: string[];
  audioTranscription?: string;
}

export function TriageIntakeForm({ darkMode = false }: TriageIntakeFormProps) {
  const { getToken, isAuthenticated, isLoading: authLoading } = useAuth();

  const [formData, setFormData] = useState<TriageFormData>({
    reason: '',
    symptoms: [],
  });

  const [symptomInput, setSymptomInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);

  // Handle reason change
  const handleReasonChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, reason: e.target.value }));
  }, []);

  // Handle adding symptom
  const handleAddSymptom = useCallback(() => {
    if (symptomInput.trim() && !formData.symptoms.includes(symptomInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        symptoms: [...prev.symptoms, symptomInput.trim()],
      }));
      setSymptomInput('');
    }
  }, [symptomInput, formData.symptoms]);

  // Handle removing symptom
  const handleRemoveSymptom = useCallback((symptom: string) => {
    setFormData((prev) => ({
      ...prev,
      symptoms: prev.symptoms.filter((s) => s !== symptom),
    }));
  }, []);

  // Handle conversation capture save
  const handleConversationSave = useCallback(async (session: ConversationSession) => {
    try {
      // Get transcription from session
      const transcription = session.transcription
        .filter((seg: TranscriptionSegment) => seg.isFinal)
        .map((seg: TranscriptionSegment) => seg.text)
        .join(' ');

      if (transcription) {
        setFormData((prev) => ({
          ...prev,
          audioTranscription: transcription,
        }));

        await Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Transcription added',
          showConfirmButton: false,
          timer: 2000,
          background: darkMode ? '#1f2937' : '#ffffff',
          color: darkMode ? '#f3f4f6' : '#1f2937',
        });
      }

      setShowRecorder(false);
    } catch (error) {
      console.error('Failed to save conversation:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: 'Failed to save conversation recording',
        background: darkMode ? '#1f2937' : '#ffffff',
        color: darkMode ? '#f3f4f6' : '#1f2937',
      });
    }
  }, [darkMode]);

  // Handle conversation capture cancel
  const handleConversationCancel = useCallback(() => {
    setShowRecorder(false);
  }, []);

  // Validate form
  const validateForm = useCallback((): boolean => {
    if (!formData.reason.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please provide a reason for the consultation',
        background: darkMode ? '#1f2937' : '#ffffff',
        color: darkMode ? '#f3f4f6' : '#1f2937',
      });
      return false;
    }

    if (formData.symptoms.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please add at least one symptom',
        background: darkMode ? '#1f2937' : '#ffffff',
        color: darkMode ? '#f3f4f6' : '#1f2937',
      });
      return false;
    }

    return true;
  }, [formData, darkMode]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Get authentication token
      const token = getToken();

      if (!token) {
        throw new Error('Not authenticated. Please refresh the page.');
      }

      const response = await fetch('/api/triage/intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: formData.reason,
          symptoms: formData.symptoms,
          audioTranscription: formData.audioTranscription,
          metadata: {
            timestamp: Date.now(),
            source: 'triage-intake-form',
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit triage intake');
      }

      // Success
      await Swal.fire({
        icon: 'success',
        title: 'Submitted Successfully',
        html: `
          <p>Triage intake has been recorded.</p>
          <p class="text-sm opacity-70 mt-2">Buffer ID: ${result.bufferId}</p>
          <p class="text-sm opacity-70">Expires: ${new Date(result.expiresAt).toLocaleString()}</p>
        `,
        background: darkMode ? '#1f2937' : '#ffffff',
        color: darkMode ? '#f3f4f6' : '#1f2937',
        confirmButtonColor: '#10b981',
      });

      // Reset form
      setFormData({
        reason: '',
        symptoms: [],
        audioTranscription: undefined,
      });
    } catch (error) {
      console.error('Submit error:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: error instanceof Error ? error.message : 'Unknown error occurred',
        background: darkMode ? '#1f2937' : '#ffffff',
        color: darkMode ? '#f3f4f6' : '#1f2937',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, darkMode]);

  if (showRecorder) {
    return (
      <div className="recorder-container">
        <SlimConversationCapture
          onSave={handleConversationSave}
          onCancel={handleConversationCancel}
          darkMode={darkMode}
        />
      </div>
    );
  }

  // Show loading state while authenticating
  if (authLoading) {
    return (
      <div className="triage-intake-form">
        <div className="auth-loading" style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Authenticating...</p>
        </div>
      </div>
    );
  }

  // Show error if not authenticated after loading
  if (!isAuthenticated) {
    return (
      <div className="triage-intake-form">
        <div className="auth-error" style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
          <p>Authentication failed. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="triage-intake-form">
      <form onSubmit={handleSubmit} className="form-container">
        {/* Reason Section */}
        <div className="form-section">
          <label htmlFor="reason" className="form-label">
            Reason for Consultation <span className="required">*</span>
          </label>
          <textarea
            id="reason"
            value={formData.reason}
            onChange={handleReasonChange}
            placeholder="Describe the main reason for this consultation..."
            className="form-textarea"
            rows={4}
            required
          />
          <p className="form-hint">
            Example: &ldquo;Patient experiencing chest pain for 2 hours&rdquo;
          </p>
        </div>

        {/* Symptoms Section */}
        <div className="form-section">
          <label htmlFor="symptoms" className="form-label">
            Symptoms <span className="required">*</span>
          </label>

          <div className="symptom-input-group">
            <input
              type="text"
              id="symptoms"
              value={symptomInput}
              onChange={(e) => setSymptomInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSymptom();
                }
              }}
              placeholder="Enter a symptom and press Enter or click Add"
              className="form-input"
            />
            <button
              type="button"
              onClick={handleAddSymptom}
              className="btn btn-secondary"
              disabled={!symptomInput.trim()}
            >
              Add
            </button>
          </div>

          {formData.symptoms.length > 0 && (
            <div className="symptoms-list">
              {formData.symptoms.map((symptom, index) => (
                <div key={index} className="symptom-tag">
                  <span>{symptom}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSymptom(symptom)}
                    className="symptom-remove"
                    aria-label="Remove symptom"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="form-hint">
            Add individual symptoms (e.g., &ldquo;fever&rdquo;, &ldquo;cough&rdquo;, &ldquo;headache&rdquo;)
          </p>
        </div>

        {/* Audio Transcription Section */}
        <div className="form-section">
          <label className="form-label">Audio Recording (Optional)</label>

          <button
            type="button"
            onClick={() => setShowRecorder(true)}
            className="btn btn-outline"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14Z"
                fill="currentColor"
              />
              <path
                d="M17 11C17 13.76 14.76 16 12 16C9.24 16 7 13.76 7 11H5C5 14.53 7.61 17.43 11 17.92V21H13V17.92C16.39 17.43 19 14.53 19 11H17Z"
                fill="currentColor"
              />
            </svg>
            <span>Record Conversation</span>
          </button>

          {formData.audioTranscription && (
            <div className="transcription-preview">
              <p className="transcription-label">Transcription:</p>
              <p className="transcription-text">{formData.audioTranscription}</p>
            </div>
          )}

          <p className="form-hint">
            Record patient conversation for automatic transcription
          </p>
        </div>

        {/* PHI Warning */}
        <div className="phi-warning">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 17L12 22L22 17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 12L12 17L22 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div>
            <strong>⚠️ No PHI</strong>
            <p>
              Do not include patient names, IDs, SSN, or other protected health information.
              Data is stored ephemerally for 10 minutes only.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary btn-submit"
          >
            {isSubmitting ? (
              <>
                <span className="spinner" />
                <span>Submitting...</span>
              </>
            ) : (
              <span>Submit Triage Intake</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
