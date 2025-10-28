# Medical AI Domain

> **Imported from Symfarmia for AURITY Framework**
> Version: 0.1.0
> Sprint: SPR-2025W44
> Date: 2025-10-28

## Overview

This directory contains the Medical AI domain components imported from Symfarmia, including:
- **Audio transcription** (Whisper integration)
- **Speech recognition** (Web Speech API)
- **Speaker diarization**
- **Medical terminology extraction**
- **Audio denoising**

## Directory Structure

```
aurity/domains/medical-ai/
├── hooks/
│   ├── useSimpleWhisper.ts        # Whisper transcription hook
│   ├── useWebSpeechCapture.ts     # Web Speech API hook
│   ├── useWhisperPreload.ts       # Model preloading
│   ├── useWhisperWorker.ts        # Web Worker integration
│   └── useAudioDenoising.ts       # Audio noise reduction
├── services/
│   ├── DiarizationService.ts      # Speaker separation
│   └── whisperModelCache.ts       # Model caching
├── utils/
│   ├── medicalTerms.ts            # Medical terminology extraction
│   ├── medicalTerminology.ts      # Medical term database
│   ├── LoggerStrategy.ts          # Logging utilities
│   ├── confidenceCalculation.ts   # Confidence scoring
│   ├── strategyEngine.ts          # Strategy pattern utilities
│   ├── audioHelpers.ts            # Audio processing helpers
│   └── whisperUtils.js            # Whisper utilities
└── README.md                      # This file
```

## Hooks

### useSimpleWhisper

Main hook for audio transcription using Whisper model.

**Features:**
- Audio recording
- Real-time transcription
- Medical term extraction
- WAV blob creation
- Model caching

**Usage:**
```typescript
import { useSimpleWhisper } from '@/aurity/domains/medical-ai/hooks/useSimpleWhisper';

const { startRecording, stopRecording, transcription, isProcessing } = useSimpleWhisper({
  language: 'es',
  modelSize: 'base'
});
```

### useWebSpeechCapture

Hook for browser-based speech recognition using Web Speech API.

**Features:**
- Real-time speech-to-text
- Continuous recognition
- Language support (es/en)
- Interim results

**Usage:**
```typescript
import { useWebSpeechCapture } from '@/aurity/domains/medical-ai/hooks/useWebSpeechCapture';

const { start, stop, transcript, isListening } = useWebSpeechCapture({
  lang: 'es-MX',
  continuous: true
});
```

### useWhisperPreload

Preloads Whisper model for faster transcription.

**Usage:**
```typescript
import { useWhisperPreload } from '@/aurity/domains/medical-ai/hooks/useWhisperPreload';

const { preloadModel, isLoaded } = useWhisperPreload();

useEffect(() => {
  preloadModel();
}, []);
```

### useWhisperWorker

Manages Web Worker for Whisper transcription.

**Features:**
- Background processing
- Non-blocking UI
- Progress updates

### useAudioDenoising

Audio noise reduction using Web Audio API.

**Features:**
- Noise gate
- Low-pass filter
- Compressor
- Echo cancellation

## Services

### DiarizationService

Speaker separation and identification.

**Features:**
- Multi-speaker detection
- Speaker labeling
- Timestamp association

**Usage:**
```typescript
import { DiarizationService } from '@/aurity/domains/medical-ai/services/DiarizationService';

const diarization = new DiarizationService();
const speakers = await diarization.process(audioBlob);
```

### whisperModelCache

Singleton cache for Whisper model instances.

**Features:**
- Model caching
- Worker management
- Memory optimization

## Utils

### medicalTerms

Extracts medical terminology from transcription text.

**Features:**
- Medical term recognition
- Abbreviation expansion
- Clinical terminology

**Usage:**
```typescript
import { extractMedicalTermsFromText } from '@/aurity/domains/medical-ai/utils/medicalTerms';

const terms = extractMedicalTermsFromText(transcription);
```

### LoggerStrategy

Structured logging for medical AI operations.

**Features:**
- Strategy pattern
- Log levels (info, warn, error)
- JSON output

## Integration with ConversationCapture

The Medical AI domain is designed to work with the ConversationCapture component:

```typescript
import { ConversationCapture } from '@/aurity/legacy/conversation-capture';
import { useSimpleWhisper } from '@/aurity/domains/medical-ai/hooks/useSimpleWhisper';

function MyComponent() {
  const whisper = useSimpleWhisper({ language: 'es' });

  return (
    <ConversationCapture
      autoTranscribe={true}
      whisperHook={whisper}
    />
  );
}
```

## Localization

Conversation locale files are located in `/locales`:

- `/locales/es/conversation.json` - Spanish
- `/locales/en/conversation.json` - English

## Dependencies

Required npm packages:

```json
{
  "@xenova/transformers": "^2.6.0",
  "react": "^18.0.0"
}
```

## Whisper Models

Supported model sizes:
- `tiny` - Fastest, least accurate (39M params)
- `base` - Good balance (74M params) ✅ Default
- `small` - Better accuracy (244M params)
- `medium` - High accuracy (769M params)
- `large` - Best accuracy (1550M params)

## Browser Compatibility

Requires:
- Web Audio API
- Web Workers
- MediaRecorder API
- getUserMedia API

Supported browsers:
- Chrome 60+
- Firefox 55+
- Safari 14.1+
- Edge 79+

## Security & Compliance

⚠️ **Important:**
- NO PHI data should be stored in transcriptions (Sprint SPR-2025W44 compliance)
- Audio recordings are temporary (client-side only)
- Transcriptions should be sanitized before storage
- Whisper processing runs locally (no external API calls for PHI)

## Roadmap

- [ ] Add speaker identification by voice
- [ ] Support multiple audio formats (MP3, WAV, FLAC)
- [ ] Implement real-time streaming transcription
- [ ] Add medical terminology confidence scoring
- [ ] Support offline mode with cached models
- [ ] Add transcription export (SRT, VTT, TXT)

---

**Version:** 0.1.0
**Sprint:** SPR-2025W44
**Status:** Imported
**Last Updated:** 2025-10-28
**Source:** symfarmia/src/domains/medical-ai
