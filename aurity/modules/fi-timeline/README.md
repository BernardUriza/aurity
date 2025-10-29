# FI-TIMELINE Module

**Free Intelligence Timeline Components**

> Cockpit forense auditable para sesiones de interacción

## Overview

El módulo `fi-timeline` implementa el roadmap completo de transformación del timeline de Free Intelligence, desde listado simple a tablero forense auditable production-grade.

**Card**: FI-UI-FEAT-100 (Encabezado Contextual de Sesión)
**Status**: ✅ Implemented
**Roadmap**: 19 cards totales (100-119)

## Features Implemented

### ✅ FI-UI-FEAT-100: SessionHeader Component

- **Session ID**: Display con formato `session_YYYYMMDD_HHMMSS`
- **Timespan**: Inicio → Fin con duración legible (2h 34m)
- **Size Metrics**: Interactions count, total tokens, average tokens/interaction
- **Policy Badges**: 4 badges con estados (OK/FAIL/PENDING/N/A)
  - Hash Verified: SHA256 integrity check
  - Policy Compliant: Append-only + no-mutation
  - Redaction Applied: PII removal
  - Audit Logged: Audit trail present
- **Sticky Header**: Permanece fijo al hacer scroll
- **Actions**: Refresh y Export buttons

## Architecture

```
fi-timeline/
├── components/
│   ├── SessionHeader.tsx      # Main header component
│   └── PolicyBadge.tsx         # Policy status badge
├── types/
│   └── session.ts              # TypeScript interfaces
├── utils/
│   └── mockData.ts             # Mock data generators
├── index.ts                    # Public exports
└── README.md                   # This file
```

## Setup

### 1. Environment Configuration

Create `.env.local` in `apps/aurity/` with:

```bash
# Timeline API URL (port 9002)
NEXT_PUBLIC_TIMELINE_API_URL=http://localhost:9002
```

**Important**:
- Variables prefixed with `NEXT_PUBLIC_` are accessible in the browser
- Changes to `.env.local` require Next.js restart: `pnpm dev`
- For production, set this to your NAS IP: `http://192.168.X.X:9002`
- `.env.local` is gitignored and won't be committed

### 2. Backend Timeline API

Ensure Timeline API is running on port 9002:

```bash
cd /path/to/free-intelligence
uvicorn backend.timeline_api:app --reload --port 9002 --host 0.0.0.0
```

Verify API health:

```bash
curl http://localhost:9002/health
# Expected: {"status":"healthy","version":"0.1.0"}
```

## Usage

### 1. Import components

```tsx
import { SessionHeader } from '@/aurity/modules/fi-timeline';
import { generateMockSessionHeader } from '@/aurity/modules/fi-timeline';
```

### 2. Use SessionHeader

```tsx
function TimelinePage() {
  const [sessionData, setSessionData] = useState(generateMockSessionHeader());

  const handleRefresh = () => {
    setSessionData(generateMockSessionHeader());
  };

  const handleExport = () => {
    console.log('Exporting session...');
  };

  return (
    <SessionHeader
      session={sessionData}
      sticky={true}
      onRefresh={handleRefresh}
      onExport={handleExport}
    />
  );
}
```

### 3. Mock data generators

```tsx
// Generate complete mock session
const session = generateMockSessionHeader();

// Generate with custom policy statuses
const failedSession = generateMockSessionHeaderWithStatus(
  'FAIL', // hash_verified
  'OK',   // policy_compliant
  'N/A',  // redaction_applied
  'OK'    // audit_logged
);
```

### 4. Clipboard Utilities

The module includes clipboard helpers with fallback support:

```tsx
import { copyToClipboard, copySessionId, copyOwnerHash } from '@/lib/utils/clipboard';

// Copy any text
await copyToClipboard('text to copy', 'label');  // Optional label for console log

// Copy session ID
await copySessionId('session_20251029_100000');

// Copy owner hash
await copyOwnerHash('abc123def456...');
```

**Features**:
- Modern Clipboard API (primary)
- Fallback to `document.execCommand('copy')` for older browsers
- Console logging with truncated preview
- Returns `Promise<boolean>` for success/failure

**Browser Support**:
- Modern API requires HTTPS or localhost (secure context)
- Fallback works in all browsers

### 5. Error Handling & Fallback

The Timeline page implements graceful degradation:

```tsx
try {
  // Fetch from Timeline API
  const sessions = await getSessionSummaries({ limit: 1 });
  setSessionData(convertToHeaderFormat(sessions[0]));
} catch (err) {
  console.error('[Timeline] API error:', err);

  // Fallback to mock data
  setSessionData(generateMockSessionHeader());
  setUseRealAPI(false);
}
```

**Error scenarios handled**:
1. **API Down**: Falls back to mock data, shows warning badge
2. **404 Not Found**: Catches specific session errors
3. **CORS Error**: Displays origin mismatch message
4. **Network Timeout**: Browser default timeout (~300s)

**User Feedback**:
- API Status card shows data source (API vs Mock)
- Load time displayed with color coding (<100ms green, else yellow)
- Error messages shown in warning badge

### 6. Performance Monitoring

The page tracks load performance using `performance.now()`:

```tsx
const start = performance.now();
const sessions = await getSessionSummaries({ limit: 1 });
const elapsed = performance.now() - start;
setLoadTime(elapsed);  // Displayed in API Status card
```

**Performance Targets**:
- **p95 < 100ms** for metadata load
- **p99 < 100ms** validated in smoke tests (actual: 13.4ms)

**Monitoring in Console**:
```
[Timeline] Loaded from API in 44ms (4 events)
```

## API Reference

### `<SessionHeader />`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `session` | `SessionHeaderData` | - | Session data object |
| `sticky` | `boolean` | `true` | Sticky header on scroll |
| `onRefresh` | `() => void` | - | Refresh callback |
| `onExport` | `() => void` | - | Export callback |

### `SessionHeaderData`

```typescript
interface SessionHeaderData {
  metadata: SessionMetadata;      // Session ID, user, timestamps
  timespan: SessionTimespan;      // Start, end, duration
  size: SessionSize;              // Metrics (tokens, chars)
  policy_badges: PolicyBadges;    // Policy status badges
}
```

### Policy Badge States

- **OK** (green): Verification passed
- **FAIL** (red): Verification failed
- **PENDING** (yellow): Verification in progress
- **N/A** (gray): Not applicable

## Testing

### Manual Testing

Visit `/timeline` demo page and verify:

1. **Clipboard** (FI-UI-TEST-001):
   - Click 📋 next to session_id → copies full ID
   - Click 📋 next to "Manifest:" → copies owner_hash (64 chars)
   - Icon changes to ✓ for 2 seconds
   - Console logs: `[Clipboard] Copied session-id: session_...`

2. **Responsive Design** (FI-UI-TEST-002):
   - Resize to <768px → ▼/▶ button appears
   - Click button → metrics collapse/expand
   - Resize to ≥768px → button hidden, metrics always visible
   - Sticky header works in both modes

3. **Performance** (FI-TEST-FEAT-009):
   - Check API Status card → load time should be <100ms
   - Console: `[Timeline] Loaded from API in Xms (Y events)`
   - Target: p99 < 100ms (validated: 13.4ms)

4. **API Integration** (FI-TEST-FEAT-010):
   - Happy path: Page loads with real data from API
   - API down: Stop API (kill port 9002) → fallback to mock data
   - 404: Invalid session → error message displayed
   - CORS: Verify no CORS errors in console

### Automated Testing (Future)

```bash
# Unit tests (clipboard utilities)
pnpm test lib/utils/clipboard.test.ts

# E2E tests (Playwright)
pnpm test:e2e tests/e2e/timeline.spec.ts
```

**Test Coverage Goals**:
- Unit tests: clipboard, date formatting, mock generators
- Integration tests: API client, error handling
- E2E tests: user flows, responsive behavior

## Demo

Visit `/timeline` to see the SessionHeader demo with:

- Policy status scenario selector
- Refresh and export actions
- Sticky header behavior on scroll
- All acceptance criteria validation

## Acceptance Criteria ✓

- ✅ Session ID visible with format `session_YYYYMMDD_HHMMSS`
- ✅ Timespan shows start → end with human-readable duration
- ✅ Size shows interactions count and total tokens
- ✅ 4 policy badges (Hash/Policy/Redaction/Audit) with color coding
- ✅ Sticky header remains at top on scroll
- ✅ Responsive layout (mobile + desktop)
- ✅ Refresh and export actions functional

## Next Steps

### Sprint A (P0 Cards)

- **FI-UI-FEAT-101**: Chips de Métrica por Interacción (8h)
- **FI-UI-FEAT-103**: Búsqueda y Filtros en Sesión (8h)
- **FI-UI-FEAT-104**: Panel de Metadatos Expandible (6h)
- **FI-UI-FEAT-108**: Virtualización y Budget de Render (6h)
- **FI-UI-FEAT-111**: Accesibilidad AA (WCAG 2.1) (8h)
- **FI-UI-FEAT-113**: Badges de Integridad y Policy (6h)

### Sprint B (P1 Cards)

- **FI-UI-FEAT-102**: Navegación Pro - Teclado + Mini-Seekbar (8h)
- **FI-UI-FEAT-105**: Copiar/Exportar con Procedencia (6h)
- **FI-UI-FEAT-106**: Toggle Sin Spoilers (4h)
- **FI-UI-FEAT-107**: Diff Prompt/Respuesta (6h)
- **FI-UI-FEAT-110**: Acciones Rápidas en Cada Item (5h)
- **FI-UI-FEAT-112**: Permalink/Shortlink por Interacción (4h)
- **FI-UI-FEAT-114**: Instrumentación UI (Observabilidad) (6h)
- **FI-UI-FEAT-115**: Tema y Tipografía Legible (4h)
- **FI-UI-FEAT-116**: Bulk Export (Rango) (5h)
- **FI-UI-FEAT-117**: Marcar/Etiquetar Interacciones (4h)
- **FI-UI-FEAT-118**: Toolbar de Sesión (Acciones Globales) (5h)
- **FI-UI-FEAT-119**: Pruebas de Usabilidad (Script) (8h)

## Tech Stack

- **Framework**: React 19 + Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **TypeScript**: Full type safety
- **Future**: react-window (virtualization), react-diff-view (diff), axe DevTools (a11y)

## Performance Targets

- **Render**: p95 <100ms
- **Memory**: <100MB bundle
- **FPS**: 60fps stable on scroll
- **Accessibility**: WCAG 2.1 AA compliant

## License

**Proprietary** - Part of Free Intelligence project
© 2025 Bernard Uriza Orozco

---

**Module**: FI-TIMELINE
**Version**: 0.1.0
**Status**: ✅ FI-UI-FEAT-100 Complete
**Card**: FI-UI-FEAT-100
**Roadmap**: docs/TIMELINE_OPERATIVO_ROADMAP.md
