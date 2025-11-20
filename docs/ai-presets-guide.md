# AI Presets - Guía de Concepto Básico

**Inspirado en redux-claude, simplificado para demostración**

## 🎯 ¿Qué es un Preset?

Un **preset** es una configuración predefinida para cómo debe comportarse la IA en una conversación:

```
Preset = System Prompt + Memory Config + Persistent Context
```

**NO incluye:**
- ❌ Agents (PatientQueryAgent, SOAPAgent, etc.)
- ❌ DecisionalMiddleware (orchestration)
- ❌ Routing logic (Haiku → Sonnet)

**Sí incluye:**
- ✅ System prompts (personalidad de la IA)
- ✅ Memory configuration (memoria longitudinal)
- ✅ Persistent context (estado tipo Redux)

---

## 📂 Archivos Creados

```
apps/aurity/
├─ config/ai-presets.config.ts    # Definición de presets
├─ hooks/useAIPreset.ts            # Hook para usar presets
└─ docs/ai-presets-guide.md        # Esta guía
```

---

## 🔧 Cómo Funciona

### 1. Define un Preset (config/ai-presets.config.ts)

```typescript
export const medicalAssistantPreset: AIPromptPreset = {
  id: 'fi-medical-assistant',
  name: 'Asistente Médico General',

  // Define comportamiento de la IA
  systemPrompt: `Eres un asistente médico inteligente...`,

  // Configura memoria longitudinal
  memoryConfig: {
    maxMessages: 50,              // Últimos 50 mensajes
    retentionPolicy: 'sliding-window',  // Ventana deslizante
    persistAcrossSessions: true,  // Persistir entre recargas
  },

  // Estado persistente (redux-like)
  contextWindow: {
    persistent: [
      'user.name',
      'user.specialty',
      'current_session_id',
    ],
    storageKey: 'fi-medical-assistant-context',
  },
};
```

### 2. Usa el Hook (hooks/useAIPreset.ts)

```typescript
import { useAIPreset } from '@/hooks/useAIPreset';

function ChatComponent() {
  const {
    systemPrompt,      // Para API call
    messages,          // Memoria longitudinal (50 últimos mensajes)
    addMessage,        // Agregar a memoria
    context,           // Estado persistente
    updateContext,     // Actualizar estado
  } = useAIPreset('fi-medical-assistant');

  // Cuando usuario envía mensaje
  const handleSend = async (userMessage: string) => {
    // 1. Agregar a memoria
    addMessage('user', userMessage);

    // 2. Llamar API con contexto completo
    const response = await fetch('/api/chat', {
      body: JSON.stringify({
        systemPrompt,   // From preset
        messages,       // Últimos 50 mensajes
        context,        // Estado persistente
        userMessage,
      }),
    });

    // 3. Agregar respuesta a memoria
    const data = await response.json();
    addMessage('assistant', data.response);
  };

  return <ChatWidget onSend={handleSend} />;
}
```

### 3. Actualiza Contexto Persistente

```typescript
// Al login del usuario
updateContext('user.name', 'Dr. Bernard Uriza');
updateContext('user.specialty', 'Telemedicine');

// Al crear nueva sesión
updateContext('current_session_id', 'session_20251120_143000');

// Estos valores persisten en localStorage
// y están disponibles en todas las conversaciones
```

---

## 🧠 Memoria Longitudinal

La **memoria longitudinal** significa que la IA "recuerda" conversaciones previas:

```typescript
// Primera conversación (hoy)
User: "¿Cuál es el expediente del paciente Juan Pérez?"
AI: "El paciente tiene session_20251115_100000..."

// Segunda conversación (mañana)
User: "¿Y cómo va su tratamiento?"
AI: "Basándome en la conversación anterior sobre Juan Pérez..." ✅
     // La IA recuerda la conversación de ayer!
```

### Retention Policies

1. **sliding-window**: Mantiene últimos N mensajes
   ```
   maxMessages: 50 → Solo últimos 50 mensajes
   ```

2. **keep-all**: Mantiene todo (sin límite)
   ```
   Útil para audit trails (SOAP generation)
   ```

3. **summarize-old**: Resume mensajes antiguos
   ```
   TODO: Llamar AI para resumir mensajes > maxMessages
   ```

---

## 📦 Persistent Context (Redux-like)

El **contexto persistente** es como un estado Redux que sobrevive entre sesiones:

```typescript
// Contexto persistente (localStorage)
context = {
  'user.name': 'Dr. Bernard Uriza',
  'user.specialty': 'Telemedicine',
  'current_session_id': 'session_20251120_143000',
  'corpus_path': '/storage/corpus.h5',
}

// Disponible en TODAS las conversaciones
// No se pierde al recargar página
// No se pierde al cambiar de preset
```

**¿Por qué es útil?**
- La IA siempre conoce el nombre del usuario
- La IA sabe qué sesión está activa
- La IA sabe dónde buscar datos (corpus.h5)

---

## 🎨 Presets Disponibles

### 1. Medical Assistant (Default)
```typescript
useAIPreset('fi-medical-assistant')
```
- General-purpose medical assistant
- 50 mensajes de memoria
- Tono profesional
- Persiste entre sesiones

### 2. SOAP Generator
```typescript
useAIPreset('fi-soap-generator')
```
- Especializado en notas clínicas
- 20 mensajes de memoria (audit trail)
- Tono técnico
- NO persiste (contexto fresco por nota)

### 3. Corpus Search Expert
```typescript
useAIPreset('fi-corpus-search')
```
- Búsqueda de datos HDF5
- 30 mensajes de memoria
- Resume queries antiguas
- Persiste patrones de búsqueda

---

## 🔄 Comparación con redux-claude

| Característica | redux-claude | Este Concepto |
|----------------|-------------|--------------|
| **System Prompts** | ✅ | ✅ |
| **Memoria longitudinal** | ✅ | ✅ |
| **Contexto persistente** | ✅ | ✅ |
| **13 Agents** | ✅ | ❌ |
| **DecisionalMiddleware** | ✅ | ❌ |
| **Two-model routing** | ✅ | ❌ |
| **Circuit breakers** | ✅ | ❌ |
| **Audit trail Redux** | ✅ | ❌ |

**Conclusión:** Este es el **concepto básico** de presets. La arquitectura completa de redux-claude incluye mucho más (agents, middleware, routing), pero el patrón fundamental es este.

---

## 🚀 Próximos Pasos (Opcional)

Si quisieras evolucionar hacia redux-claude completo:

1. **Phase 1** (✅ completado): Presets básicos con memoria
2. **Phase 2**: Crear agents especializados
3. **Phase 3**: Implementar DecisionalMiddleware
4. **Phase 4**: Two-model routing (Haiku → Sonnet)
5. **Phase 5**: Circuit breakers y fault tolerance

Pero por ahora, este concepto es suficiente para:
- ✅ Configurar personalidad de IA
- ✅ Mantener memoria entre conversaciones
- ✅ Persistir contexto importante
- ✅ Cambiar entre modos de conversación

---

## 💡 Ejemplos Prácticos

### Ejemplo 1: Cambiar de Preset

```typescript
// Usuario empieza en modo general
const medicalChat = useAIPreset('fi-medical-assistant');

// Usuario pide generar SOAP note
const soapChat = useAIPreset('fi-soap-generator');

// Cada preset tiene su propia memoria y contexto
// Pero contexto persistente se comparte (user.name, etc.)
```

### Ejemplo 2: Reset Conversation

```typescript
const { messages, resetConversation } = useAIPreset('fi-medical-assistant');

// Nueva consulta, nueva conversación
const handleNewPatient = () => {
  resetConversation();  // Limpia memoria
  updateContext('current_patient', 'Juan Pérez');
};
```

### Ejemplo 3: Inspect Memory

```typescript
const { messages, context } = useAIPreset('fi-medical-assistant');

console.log('Mensajes en memoria:', messages.length);
console.log('Contexto persistente:', context);

// Output:
// Mensajes en memoria: 47
// Contexto persistente: {
//   'user.name': 'Dr. Bernard',
//   'current_session_id': 'session_20251120_143000'
// }
```

---

## 📝 Notas Técnicas

- **localStorage**: Usa `ai-preset-{id}-messages` como key
- **JSON serialization**: Messages y context se guardan como JSON
- **TypeScript**: Fully typed con interfaces exportadas
- **React hooks**: Compatible con cualquier componente de React
- **Sin dependencias**: Solo React built-in hooks

---

**Creado:** 2025-11-20
**Inspirado por:** https://github.com/BernardUriza/redux-claude
**Propósito:** Demostrar concepto básico de presets para prompts con memoria longitudinal
