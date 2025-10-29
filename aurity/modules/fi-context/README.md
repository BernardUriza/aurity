# FI-CONTEXT Module

**Free Intelligence Context Management**

> No context loss policy - Una conversación infinita, nunca fragmentada

## Overview

El módulo `fi-context` implementa la política fundamental de Free Intelligence: **no_context_loss**. Garantiza que la conversación del usuario nunca se resetee sin su decisión explícita, manteniendo continuidad de identidad computacional.

## Principios

### 1. Memoria Longitudinal
- La conversación es infinita, nunca fragmentada
- Auto-save continuo a localStorage
- Recuperación automática al reload

### 2. Simetría Contextual
- El sistema recuerda lo que el usuario no puede
- Timeline continuo sin interrupciones
- Historial completo de sesiones

### 3. Consentimiento Explícito
- Warning modal antes de acciones destructivas
- Confirmación requerida para reset
- Prevención de pérdida accidental

## Features

### ✅ Implemented

- **Auto-Save**: Persistencia automática cada 5 segundos
- **Warning Modal**: Confirmación antes de reset/cierre
- **Auto-Recovery**: Recuperación automática al cargar página
- **Session History**: Historial de últimas 100 sesiones
- **Context Provider**: React Context para estado global
- **BeforeUnload Protection**: Warning al navegar fuera
- **TypeScript**: Full type safety

## Architecture

```
fi-context/
├── components/
│   └── WarningModal.tsx           # Modal de warning antes de reset
├── providers/
│   └── ContextProvider.tsx        # React Context Provider
├── services/
│   └── SessionPersistence.ts      # Persistencia a localStorage
├── types/
│   └── context.ts                 # TypeScript interfaces
├── index.ts                       # Public exports
└── README.md                      # This file
```

## Usage

### 1. Wrap your app with ContextProvider

```tsx
import { ContextProvider } from '@/aurity/modules/fi-context';

function App() {
  return (
    <ContextProvider
      policy={{
        autosave: true,
        autosaveInterval: 5000,
        warnOnReset: true,
        warnOnNavigateAway: true,
        recoverOnLoad: true,
      }}
    >
      <YourApp />
    </ContextProvider>
  );
}
```

### 2. Use the context hook

```tsx
import { useFIContext } from '@/aurity/modules/fi-context';

function MyComponent() {
  const {
    currentSession,
    createSession,
    resumeSession,
    endSession,
    warnBeforeReset,
  } = useFIContext();

  // Create new session
  const handleNewSession = async () => {
    const session = await createSession();
    console.log('Created:', session.session_id);
  };

  // End session with warning
  const handleEndSession = async () => {
    if (currentSession) {
      await endSession(currentSession.session_id, false); // false = show warning
    }
  };

  // Custom action with warning
  const handleDangerousAction = async () => {
    const confirmed = await warnBeforeReset('delete all data');
    if (confirmed) {
      // Proceed with action
    }
  };

  return (
    <div>
      {currentSession ? (
        <div>
          <p>Session: {currentSession.session_id}</p>
          <button onClick={handleEndSession}>End Session</button>
        </div>
      ) : (
        <button onClick={handleNewSession}>Start Session</button>
      )}
    </div>
  );
}
```

### 3. Manual persistence

```tsx
import { sessionPersistence } from '@/aurity/modules/fi-context';

// Save session manually
await sessionPersistence.saveSession(session);

// Load session
const session = await sessionPersistence.loadSession();

// Get history
const history = sessionPersistence.getHistory();

// Recover session
const result = await sessionPersistence.recoverSession();
if (result.success) {
  console.log('Recovered:', result.interactionsRecovered, 'interactions');
}
```

## API Reference

### `<ContextProvider />`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | App children |
| `policy` | `NoContextLossPolicyConfig` | See below | Policy configuration |

**Policy Configuration**:

```typescript
interface NoContextLossPolicyConfig {
  autosave: boolean;               // Auto-save enabled (default: true)
  autosaveInterval: number;        // Interval in ms (default: 5000)
  warnOnReset: boolean;            // Show warning modal (default: true)
  warnOnNavigateAway: boolean;     // Warn on page leave (default: true)
  recoverOnLoad: boolean;          // Auto-recover on load (default: true)
  maxSessionHistory: number;       // Max sessions (default: 100)
}
```

### `useFIContext()`

**Returns**:

| Field | Type | Description |
|-------|------|-------------|
| `currentSession` | `Session \| null` | Current active session |
| `sessions` | `Session[]` | All sessions |
| `isLoading` | `boolean` | Loading state |
| `error` | `Error \| null` | Error state |
| `policy` | `NoContextLossPolicyConfig` | Active policy config |
| `createSession` | `() => Promise<Session>` | Create new session |
| `resumeSession` | `(id) => Promise<Session>` | Resume existing session |
| `endSession` | `(id, confirmed) => Promise<void>` | End session |
| `persistSession` | `(session) => Promise<void>` | Save session |
| `recoverSession` | `() => Promise<Session \| null>` | Recover from storage |
| `preventContextLoss` | `() => void` | Enable beforeunload |
| `warnBeforeReset` | `(action) => Promise<boolean>` | Show warning |

### Session Structure

```typescript
interface Session {
  session_id: string;              // session_YYYYMMDD_HHMMSS
  thread_id?: string;              // UUID v4 (optional)
  user_id?: string;                // User identifier
  created_at: string;              // ISO 8601
  last_active: string;             // ISO 8601
  interaction_count: number;       // Total interactions
  is_persisted: boolean;           // Saved to storage
}
```

## Storage

### localStorage Keys

- `fi_session_current` - Current session
- `fi_session_history` - Session history (last 100)
- `fi_no_context_loss_policy` - Policy config

### Data Structure

```json
{
  "session_id": "session_20241029_001234",
  "created_at": "2024-10-29T00:12:34-06:00",
  "last_active": "2024-10-29T00:15:42-06:00",
  "interaction_count": 5,
  "is_persisted": true
}
```

## Warning Modal

The warning modal appears before any destructive action:

- **Reset conversation**: Confirms before clearing context
- **Navigate away**: Warns on page leave with unsaved changes
- **End session**: Confirms before ending active session
- **Custom actions**: Use `warnBeforeReset()` for custom warnings

## Auto-Save Behavior

- **Interval**: Every 5 seconds (configurable)
- **Trigger**: Automatic when `autosave: true`
- **Storage**: localStorage (10MB limit)
- **Cleanup**: Auto-cleanup of stale sessions (>7 days)

## Session Recovery

On page load:

1. Check localStorage for `fi_session_current`
2. Validate session structure and age
3. Reject if >7 days old
4. Restore session state to Context
5. Resume autosave timer

## Error Handling

- **Storage Quota Exceeded**: Falls back to memory-only mode
- **Invalid Session Data**: Clears storage and starts fresh
- **Stale Sessions**: Auto-cleanup prevents bloat

## Best Practices

### ✅ DO

- Wrap your app root with ContextProvider
- Use `warnBeforeReset()` for destructive actions
- Call `endSession()` with `confirmed: false` to show warning
- Let auto-save handle persistence
- Use session history for "recent conversations"

### ❌ DON'T

- Don't bypass warnings for critical actions
- Don't disable auto-save without good reason
- Don't store sensitive data in sessions (use encryption)
- Don't clear localStorage manually (use `endSession()`)

## Testing

```bash
# Unit tests (when implemented)
cd apps/aurity
pnpm test fi-context
```

## Integration with InteractionViewer

```tsx
import { useFIContext } from '@/aurity/modules/fi-context';
import { InteractionViewer } from '@/aurity/modules/fi-viewer';

function App() {
  const { currentSession } = useFIContext();

  return (
    <div>
      {currentSession && (
        <InteractionViewer
          interaction={currentInteraction}
          onNavigateNext={() => {
            // Navigation preserves session
          }}
        />
      )}
    </div>
  );
}
```

## Future Enhancements

- [ ] IndexedDB for larger storage (>10MB)
- [ ] Cloud sync (optional, with encryption)
- [ ] Session export/import
- [ ] Multi-device sync
- [ ] Session compression
- [ ] Analytics (without PII)

## Philosophy

> "La conversación no se resetea jamás sin decisión explícita del usuario."

Free Intelligence trata la memoria como sagrada. Cada interacción es parte de una conversación infinita. La pérdida de contexto es una forma de amnesia digital - la prevenimos por diseño.

## License

**Proprietary** - Part of Free Intelligence project
© 2025 Bernard Uriza Orozco

---

**Module**: FI-CONTEXT
**Version**: 0.1.0
**Status**: ✅ Production Ready
**Card**: FI-UI-FEAT-003
**Sprint**: SPR-2025W44
