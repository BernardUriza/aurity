import { TranscriptionResult } from '../types';

export function confidenceCalculation(result: TranscriptionResult): number {
  return result.confidence ?? 0;
}
