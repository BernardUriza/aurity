# Triage Intake Module

> **Sprint SPR-2025W44 - Free Intelligence Core**
> Version: 0.1.0

## Overview

Complete triage intake system with conversation capture and automatic transcription. Designed for clinical triage workflows with NO PHI data storage.

## Features

- ✅ **Triage Form** - Capture reason + symptoms
- ✅ **Conversation Recording** - Integrated ConversationCapture component
- ✅ **Whisper API Integration** - Automatic audio transcription
- ✅ **Ephemeral Storage** - 10-minute TTL, no PHI persistence
- ✅ **PHI Validation** - Client and server-side PHI detection
- ✅ **RBAC Protected** - Permission-based API access
- ✅ **Dark Mode** - Full theme support
- ✅ **Responsive Design** - Mobile/tablet/desktop

## Architecture

```
app/triage/
├── page.tsx                           # Main triage page
├── components/
│   └── TriageIntakeForm.tsx          # Triage form with recorder
├── styles/
│   └── triage.css                    # Complete styling
└── README.md                         # This file

app/api/triage/
├── intake/
│   └── route.ts                      # POST/GET intake endpoint
└── transcribe/
    └── route.ts                      # POST transcription endpoint
```

## API Endpoints

### POST /api/triage/intake

Submit triage intake data.

**Request:**
```typescript
{
  reason: string;
  symptoms: string[];
  audioTranscription?: string;
  metadata?: {
    timestamp: number;
    duration?: number;
    source: string;
  };
}
```

**Response (201):**
```json
{
  "success": true,
  "bufferId": "uuid",
  "message": "Triage intake stored successfully (ephemeral)",
  "expiresAt": "2025-10-28T..."
}
```

**Headers:**
- `Authorization: Bearer <token>` (required)

**Permissions:**
- Requires `WRITE_STORAGE` permission

### GET /api/triage/intake?bufferId=xxx

Retrieve triage intake data.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "reason": "...",
    "symptoms": ["..."],
    "audioTranscription": "...",
    "timestamp": 1730088000000,
    "userId": "..."
  },
  "metadata": {
    "bufferId": "...",
    "createdAt": "...",
    "expiresAt": "..."
  }
}
```

**Permissions:**
- Requires `READ_STORAGE` permission

### POST /api/triage/transcribe

Transcribe audio using Whisper API.

**Request (multipart/form-data):**
- `audio`: File (required, max 25MB)
- `language`: string (optional, e.g., "en", "es")
- `prompt`: string (optional)

**Response (200):**
```json
{
  "success": true,
  "transcription": {
    "text": "Full transcription...",
    "segments": [
      {
        "id": "uuid",
        "text": "Segment text",
        "timestamp": 1234,
        "confidence": 0.95,
        "isFinal": true
      }
    ],
    "language": "en",
    "duration": 45.2
  }
}
```

**Supported Audio Formats:**
- audio/webm
- audio/mp4
- audio/mpeg
- audio/wav
- audio/ogg
- audio/flac

**Permissions:**
- Requires `WRITE_STORAGE` permission

## Usage

### Access Triage Page

Navigate to `/triage` in your browser.

### Form Workflow

1. **Enter Reason**: Describe consultation reason
2. **Add Symptoms**: Add individual symptoms (min 1 required)
3. **Optional Recording**: Click "Record Conversation" to capture audio
4. **Submit**: Data stored ephemerally for 10 minutes

### Recording Workflow

1. Click "Record Conversation"
2. ConversationCapture component loads
3. Record consultation audio
4. Stop recording
5. Transcription automatically added to form
6. Submit combined data

## Configuration

### Environment Variables

Required in `.env.local`:

```bash
# Whisper API (OpenAI)
WHISPER_API_KEY=sk-...
# OR
OPENAI_API_KEY=sk-...

# Storage configuration (inherited from core)
STORAGE_BASE_DIR=/tmp/aurity-demo/storage
STORAGE_MAX_BUFFER_SIZE=10485760
STORAGE_DEFAULT_TTL=600
```

## PHI Protection

### Client-Side Validation

Form validates for common PHI patterns before submission:
- SSN patterns (xxx-xx-xxxx)
- ID/License patterns
- "patient name" phrases
- "patient id" phrases

### Server-Side Validation

API endpoints perform additional PHI checks:
- Pattern matching on all text fields
- Audio transcription PHI detection
- Returns 400 error if PHI detected

### Best Practices

❌ **DO NOT include:**
- Patient names
- Patient IDs
- SSN, driver's license
- Addresses, phone numbers
- Medical record numbers

✅ **DO include:**
- Symptom descriptions
- Equipment observations
- General medical terms
- Timestamps, durations

## Security

### Authentication Required

All API endpoints require:
1. Valid JWT token in Authorization header
2. Active session validated via AuthManager
3. Appropriate permissions (READ_STORAGE or WRITE_STORAGE)

### Ephemeral Storage

- All data stored with 10-minute TTL
- Automatic cleanup by StorageManager
- No PHI persistence
- SHA256 integrity verification

## Examples

### Submit Triage Intake

```typescript
const response = await fetch('/api/triage/intake', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    reason: 'Equipment malfunction during procedure',
    symptoms: ['alarm sounding', 'temperature spike', 'pressure drop'],
    metadata: {
      timestamp: Date.now(),
      source: 'triage-intake-form',
    },
  }),
});
```

### Transcribe Audio

```typescript
const formData = new FormData();
formData.append('audio', audioBlob, 'recording.webm');
formData.append('language', 'en');

const response = await fetch('/api/triage/transcribe', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
});

const result = await response.json();
console.log(result.transcription.text);
```

## Testing

### Manual Testing

1. Start dev server: `npm run dev`
2. Login as admin (via demo auth)
3. Navigate to `/triage`
4. Fill form and submit
5. Verify success message
6. Check buffer storage in `/tmp/aurity-demo/storage`

### Integration Testing

```bash
# TODO: Implement integration tests
npm run test:integration
```

## Limitations (Sprint SPR-2025W44)

⚠️ **Current Limitations:**
- No camera/video support
- No offline mode
- Ephemeral storage only (10 min TTL)
- Stub authentication (production requires real auth)
- No database persistence
- No multi-language UI (English only)

## Roadmap

- [ ] Integration tests for API endpoints
- [ ] E2E tests for form submission
- [ ] Database persistence (optional long-term storage)
- [ ] Multi-language support (ES, FR, PT)
- [ ] Export triage data (PDF, JSON)
- [ ] Triage history view
- [ ] Advanced PHI detection (ML-based)
- [ ] Real-time collaboration

---

**Version:** 0.1.0
**Sprint:** SPR-2025W44
**Status:** Feature Complete
**Last Updated:** 2025-10-28
