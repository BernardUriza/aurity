# ConversationCapture Component

> **Extracted from symfarmia/dev for Aurity Framework**
> Version: 0.1.0
> Sprint: SPR-2025W44

## Overview

React component for recording conversations with real-time transcription support. Features voice-reactive UI, dark mode, and comprehensive audio controls.

## Features

- ✅ **Audio Recording** - MediaRecorder API with multiple codec support
- ✅ **Voice Reactivity** - Animated microphone responds to voice input
- ✅ **Live Transcription** - Real-time transcription display (Whisper API ready)
- ✅ **Dark Mode** - Full dark/light theme support
- ✅ **Animations** - Smooth fade-in, slide-in, and voice-reactive animations
- ✅ **Recording Controls** - Start, pause, resume, stop, cancel
- ✅ **Audio Waveform** - Real-time waveform visualization
- ✅ **SweetAlert2** - Custom toast notifications
- ✅ **TypeScript** - Fully typed

## Architecture

```
aurity/legacy/conversation-capture/
├── ConversationCapture.tsx      # Main component
├── index.ts                     # Main export
├── types/
│   └── index.ts                 # TypeScript definitions
├── hooks/
│   ├── useUIState.ts            # UI state management
│   ├── useTranscriptionState.ts # Transcription state
│   ├── useAudioRecorder.ts      # Audio recording logic
│   └── index.ts
├── components/
│   ├── VoiceReactiveMicrophone.tsx  # Animated mic icon
│   ├── LiveTranscriptionDisplay.tsx # Transcription view
│   ├── RecordingControls.tsx        # Control buttons
│   ├── RecordingTimer.tsx           # Duration timer
│   ├── AudioWaveform.tsx            # Waveform visualization
│   └── index.ts
├── styles/
│   └── conversation-capture.css # Complete styles
└── README.md                    # This file
```

## Usage

### Basic Example

```tsx
import { ConversationCapture } from '@/aurity/legacy/conversation-capture';

function MyPage() {
  const handleSave = (session) => {
    console.log('Recording saved:', session);
    // Upload to server, save to database, etc.
  };

  const handleCancel = () => {
    console.log('Recording cancelled');
  };

  return (
    <ConversationCapture
      onSave={handleSave}
      onCancel={handleCancel}
      autoTranscribe={true}
      showLiveTranscription={true}
      darkMode={false}
    />
  );
}
```

### With Custom Options

```tsx
<ConversationCapture
  onSave={handleSave}
  onCancel={handleCancel}
  autoTranscribe={true}
  showLiveTranscription={true}
  whisperOptions={{
    model: 'whisper-1',
    language: 'es',
    temperature: 0.2,
  }}
  recordingOptions={{
    audioBitsPerSecond: 128000,
    sampleRate: 48000,
    echoCancellation: true,
    noiseSuppression: true,
  }}
  darkMode={true}
/>
```

## Props

### ConversationCaptureProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onSave` | `(session: ConversationSession) => void` | - | Callback when recording is saved |
| `onCancel` | `() => void` | - | Callback when recording is cancelled |
| `autoTranscribe` | `boolean` | `false` | Enable automatic transcription |
| `showLiveTranscription` | `boolean` | `true` | Show live transcription panel |
| `whisperOptions` | `WhisperOptions` | `{}` | Whisper API configuration |
| `recordingOptions` | `RecordingOptions` | `{}` | Audio recording settings |
| `darkMode` | `boolean` | `false` | Initial dark mode state |

### ConversationSession (returned by onSave)

```typescript
{
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number;           // seconds
  transcription: TranscriptionSegment[];
  audioBlob: Blob;
  audioMetadata: AudioMetadata;
  status: RecordingState;
}
```

## Components

### VoiceReactiveMicrophone

Animated microphone icon that reacts to voice volume:
- Scales based on volume (0-100)
- Pulse effect when volume > 50
- Animated ripple rings when recording

### LiveTranscriptionDisplay

Displays transcription segments with:
- Auto-scroll to latest segment
- Final vs interim segment styling
- Confidence scores
- Timestamps
- Typing indicator

### RecordingControls

Button controls for:
- Start recording
- Pause/Resume
- Stop recording
- Cancel recording
- Processing state

### RecordingTimer

Timer display showing:
- Current duration (MM:SS or HH:MM:SS)
- Recording/Paused status
- Animated recording dot

### AudioWaveform

Real-time waveform visualization:
- 40 animated bars
- Gradient colors (blue to purple)
- Reacts to volume level
- Canvas-based rendering

## Hooks

### useUIState

Manages UI state:
```typescript
const {
  uiState,
  startRecording,
  pauseRecording,
  resumeRecording,
  stopRecording,
  finishProcessing,
  toggleTranscription,
  toggleDarkMode,
  setVolume,
  reset,
} = useUIState(initialDarkMode);
```

### useTranscriptionState

Manages transcription segments:
```typescript
const {
  transcriptionState,
  addSegment,
  updateSegment,
  removeSegment,
  clearSegments,
  startLive,
  stopLive,
  setError,
  reset,
  getFullTranscript,
} = useTranscriptionState();
```

### useAudioRecorder

Handles audio recording:
```typescript
const {
  isRecording,
  isPaused,
  audioBlob,
  audioMetadata,
  error,
  startRecording,
  pauseRecording,
  resumeRecording,
  stopRecording,
  reset,
} = useAudioRecorder(recordingOptions);
```

## Styling

### CSS Variables

The component uses CSS custom properties for theming:

```css
:root {
  --cc-primary: #3b82f6;
  --cc-success: #10b981;
  --cc-warning: #f59e0b;
  --cc-danger: #ef4444;
  --cc-secondary: #6b7280;
  /* ... */
}
```

### Dark Mode

Dark mode is fully supported via the `.dark` class on the root element. Toggle with the moon/sun button in the header.

### Animations

Built-in animations:
- `fade-in` - Opacity fade (0.5s)
- `slide-in` - Vertical slide with fade (0.4s)
- `pulse-dot` - Pulsing recording indicator
- `pulse-scale` - Scale pulse for voice reactivity
- `ripple` - Expanding rings around microphone
- `typing` - Typing indicator dots
- `spin` - Loading spinner

### Responsive Design

Breakpoints:
- Mobile: < 480px
- Tablet: < 768px
- Desktop: >= 768px

## Transcription Integration

### Whisper API (TODO)

To enable transcription, implement the Whisper API call in `ConversationCapture.tsx`:

```typescript
// In handleStopRecording, replace the TODO with:
const formData = new FormData();
formData.append('file', blob, 'recording.webm');
formData.append('model', whisperOptions.model || 'whisper-1');
if (whisperOptions.language) {
  formData.append('language', whisperOptions.language);
}

const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
  },
  body: formData,
});

const result = await response.json();
const segment: TranscriptionSegment = {
  id: crypto.randomUUID(),
  text: result.text,
  timestamp: Date.now(),
  confidence: 1.0,
  isFinal: true,
};
addSegment(segment);
```

## Dependencies

Required npm packages:

```json
{
  "react": "^18.0.0",
  "sweetalert2": "^11.0.0"
}
```

## Browser Compatibility

Requires:
- MediaRecorder API
- getUserMedia API
- Blob/File APIs
- Canvas API

Supported browsers:
- Chrome 60+
- Firefox 55+
- Safari 14.1+
- Edge 79+

## Security Notes

⚠️ **Important:**
- NO PHI data should be stored in transcriptions (Sprint SPR-2025W44 compliance)
- Audio recordings are temporary (client-side only)
- Transcriptions should be sanitized before storage
- Whisper API calls should be proxied through backend

## Examples

### Medical Consultation (NO PHI)

```typescript
// Store only metadata, not patient details
const session = {
  id: 'conv-001',
  timestamp: Date.now(),
  duration: 180,
  consultationType: 'general',
  // NO patient names, IDs, or PHI
};
```

### Equipment Discussion

```typescript
// Safe to transcribe equipment discussions
const session = {
  transcription: [
    { text: "The autoclave temperature is 121°C", ... },
    { text: "Equipment calibration completed", ... },
  ],
};
```

## Troubleshooting

### Microphone Access Denied

```javascript
// Error: MICROPHONE_ACCESS
// Solution: Check browser permissions, ensure HTTPS
```

### No Audio Recorded

```javascript
// Check MediaRecorder support
if (!MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
  console.log('Codec not supported, trying fallback...');
}
```

### Transcription Not Working

1. Check Whisper API key is configured
2. Verify `autoTranscribe={true}` is set
3. Implement the Whisper API call (currently TODO)

## Roadmap

- [ ] Implement Whisper API integration
- [ ] Add speaker diarization
- [ ] Support multiple audio formats (MP3, WAV)
- [ ] Add audio playback controls
- [ ] Export transcription to various formats (SRT, VTT, TXT)
- [ ] Offline recording support
- [ ] Real-time volume metering with Web Audio API

---

**Version:** 0.1.0
**Sprint:** SPR-2025W44
**Status:** Feature Complete
**Last Updated:** 2025-10-28
