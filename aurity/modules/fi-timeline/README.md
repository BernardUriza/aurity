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
