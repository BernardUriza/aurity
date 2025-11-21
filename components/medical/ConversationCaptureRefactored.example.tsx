/**
 * ConversationCaptureRefactored - Example of refactored component
 *
 * USAGE EXAMPLE (NOT PRODUCTION CODE YET)
 *
 * Shows how ConversationCapture would look after refactoring with custom hooks
 * Compare lines of code:
 * - Before: 967 lines
 * - After: ~150 lines (orchestrator only)
 *
 * Created: 2025-11-15
 * Part of: ConversationCapture decomposition refactoring
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useWorkflowMachine } from '@/hooks/useWorkflowMachine';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { useChunkUploader } from '@/hooks/useChunkUploader';
import { useWorkflowProgress, WorkflowPhase } from '@/hooks/useWorkflowProgress';
import { medicalWorkflowApi } from '@/lib/api/medical-workflow';
import { WorkflowState } from '@/lib/state/workflowMachine';

interface Props {
  onNext?: () => void;
  className?: string;
}

export function ConversationCaptureRefactored({ onNext, className }: Props) {
  // 1. State machine (replaces 45+ useState declarations)
  const machine = useWorkflowMachine();

  // 2. Audio recording
  const recording = useAudioRecording({
    onDataAvailable: (blob) => {
      // Upload chunk when available
      if (machine.context.sessionId) {
        const chunkNumber = uploader.totalChunks;
        uploader.uploadChunk(machine.context.sessionId, chunkNumber, blob);
      }
    },
  });

  // 3. Chunk uploader
  const uploader = useChunkUploader({
    onUploadComplete: (chunkNumber) => {
      console.log(`Chunk ${chunkNumber} uploaded`);
    },
  });

  // 4. Workflow progress
  const progress = useWorkflowProgress();

  // ===== Event Handlers =====

  const handleStart = useCallback(async () => {
    machine.send({ type: 'START_RECORDING' });
    progress.setPhase(WorkflowPhase.UPLOADING);
    await recording.startRecording();
  }, [machine, recording, progress]);

  const handlePause = useCallback(() => {
    machine.send({ type: 'PAUSE' });
    progress.setPhase(WorkflowPhase.CHECKPOINT);
    recording.pauseRecording();

    // Create checkpoint
    if (machine.context.sessionId) {
      medicalWorkflowApi.createCheckpoint(machine.context.sessionId);
    }
  }, [machine, recording, progress]);

  const handleResume = useCallback(() => {
    machine.send({ type: 'RESUME' });
    progress.setPhase(WorkflowPhase.UPLOADING);
    recording.resumeRecording();
  }, [machine, recording, progress]);

  const handleStop = useCallback(async () => {
    machine.send({ type: 'STOP' });

    const blob = await recording.stopRecording();

    if (blob && machine.context.sessionId) {
      // End session
      await medicalWorkflowApi.endSession(machine.context.sessionId, blob);

      // Start diarization
      progress.setPhase(WorkflowPhase.DIARIZING);
      const diarizationResult = await medicalWorkflowApi.startDiarization(
        machine.context.sessionId
      );

      machine.updateContext({ diarizationJobId: diarizationResult.job_id });
      machine.send({ type: 'UPLOAD_COMPLETE' });
    }
  }, [machine, recording, progress]);

  // ===== Effects =====

  // Auto-trigger SOAP generation when diarization completes
  useEffect(() => {
    if (machine.state === WorkflowState.SOAP_GENERATION && machine.context.sessionId) {
      progress.setPhase(WorkflowPhase.SOAP_GENERATION);

      medicalWorkflowApi
        .startSOAPGeneration(machine.context.sessionId)
        .then((result) => {
          machine.updateContext({ soapJobId: result.job_id });
          // Poll SOAP status...
          // When complete:
          machine.send({ type: 'SOAP_COMPLETE' });
        })
        .catch((error) => {
          machine.send({ type: 'ERROR', error: error.message });
        });
    }
  }, [machine.state, machine.context.sessionId]);

  // ===== Render =====

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* State Machine Debug */}
        <div className="text-xs text-gray-500">
          State: {machine.state} | Progress: {progress.overallProgress}%
        </div>

        {/* Recording Controls */}
        <div className="flex gap-2">
          {machine.isIdle && (
            <button onClick={handleStart} className="btn-primary">
              Start Recording
            </button>
          )}

          {machine.isRecording && (
            <>
              <button onClick={handlePause} className="btn-secondary">
                Pause
              </button>
              <button onClick={handleStop} className="btn-danger">
                Stop
              </button>
            </>
          )}

          {machine.isPaused && (
            <>
              <button onClick={handleResume} className="btn-primary">
                Resume
              </button>
              <button onClick={handleStop} className="btn-danger">
                Stop
              </button>
            </>
          )}
        </div>

        {/* Audio Level Visualizer */}
        {machine.isRecording && (
          <div className="h-2 bg-gray-200 rounded">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${recording.audioLevel * 100}%` }}
            />
          </div>
        )}

        {/* Upload Progress */}
        {uploader.isUploading && (
          <div className="text-sm">
            Uploading: {uploader.completedChunks} / {uploader.totalChunks} chunks
          </div>
        )}

        {/* Workflow Progress */}
        <div className="text-sm">
          {progress.phaseInfo.label}: {progress.phaseInfo.description}
        </div>

        {/* Error State */}
        {machine.hasError && (
          <div className="text-red-500">
            Error: {machine.context.errorMessage}
            <button onClick={machine.reset} className="btn-secondary ml-2">
              Retry
            </button>
          </div>
        )}

        {/* Completed */}
        {machine.isCompleted && (
          <div className="text-green-500">
            Workflow completed!
            <button onClick={onNext} className="btn-primary ml-2">
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * COMPARISON:
 *
 * BEFORE (ConversationCapture.tsx):
 * - 967 lines
 * - 45+ useState declarations
 * - Scattered business logic
 * - No state machine
 * - Impossible to test
 *
 * AFTER (this example):
 * - ~150 lines (orchestrator only)
 * - 4 custom hooks (single responsibility)
 * - State machine prevents invalid states
 * - Business logic extracted to hooks
 * - Each hook is testable independently
 *
 * NEXT STEPS:
 * 1. Gradually replace ConversationCapture with this pattern
 * 2. Add comprehensive tests for each hook
 * 3. Migrate UI rendering to subcomponents
 * 4. Add SOAP polling modal
 * 5. Complete Phase 5 (encryption) integration
 */
