/**
 * API Route: /api/interactions
 *
 * Fetch interactions from Free Intelligence backend corpus
 * Integrates with Python backend corpus_ops.py via HTTP or direct file access
 */

import { NextRequest, NextResponse } from 'next/server';

interface Interaction {
  interaction_id: string;
  session_id: string;
  thread_id?: string;
  prompt: string;
  response: string;
  model: string;
  timestamp: string;
  tokens?: number;
  duration_ms?: number;
  user_id?: string;
  owner_hash?: string;
}

/**
 * GET /api/interactions
 *
 * Query parameters:
 * - session_id: Filter by session ID (optional)
 * - limit: Number of interactions to return (default: 100)
 * - offset: Offset for pagination (default: 0)
 *
 * @example
 * GET /api/interactions?session_id=session_20241028_123456&limit=10
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Option 1: Call Python backend API (if running FastAPI on port 7000)
    const backendUrl = process.env.FI_BACKEND_URL || 'http://localhost:7000';
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (sessionId) {
      params.append('session_id', sessionId);
    }

    const response = await fetch(`${backendUrl}/api/interactions?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      interactions: data.interactions || [],
      total: data.total || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Failed to fetch interactions:', error);

    // Return mock data for development if backend is not available
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        interactions: getMockInteractions(),
        total: 3,
        limit: 100,
        offset: 0,
      });
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch interactions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Mock interactions for development
 */
function getMockInteractions(): Interaction[] {
  return [
    {
      interaction_id: '550e8400-e29b-41d4-a716-446655440000',
      session_id: 'session_20241028_123456',
      thread_id: '660e8400-e29b-41d4-a716-446655440001',
      prompt: '# Test Prompt\n\nThis is a **test prompt** with:\n\n- Markdown formatting\n- Multiple lines\n- Code blocks:\n\n```python\nprint("Hello, Free Intelligence!")\n```',
      response: '# Test Response\n\nThis is a **test response** with:\n\n- Markdown rendering\n- Syntax highlighting\n- Professional formatting\n\n```typescript\nconst viewer: InteractionViewer = {\n  features: ["split-view", "markdown", "metadata"],\n  status: "working"\n};\n```',
      model: 'claude-3-5-sonnet-20241022',
      timestamp: '2024-10-28T12:34:56-06:00',
      tokens: 256,
      duration_ms: 1250,
      user_id: 'bernard.uriza@example.com',
      owner_hash: '9f87ac3a4326090e1234567890abcdef',
    },
    {
      interaction_id: '550e8400-e29b-41d4-a716-446655440002',
      session_id: 'session_20241028_123456',
      prompt: 'What is Free Intelligence?',
      response: 'Free Intelligence is a **resident, persistent AI system** that lives locally with you, not in the cloud.\n\nKey principles:\n\n1. **Residency** - AI lives with you, not in the cloud\n2. **Longitudinal Memory** - Infinite conversation, never fragmented\n3. **Contextual Symmetry** - AI remembers what you can\'t\n4. **Architectural Autonomy** - No SaaS dependency\n5. **Symbiotic Purpose** - Returns who you\'ve been',
      model: 'claude-3-5-sonnet-20241022',
      timestamp: '2024-10-28T12:35:30-06:00',
      tokens: 180,
      duration_ms: 980,
    },
    {
      interaction_id: '550e8400-e29b-41d4-a716-446655440003',
      session_id: 'session_20241028_123456',
      prompt: 'How does the InteractionViewer work?',
      response: 'The **InteractionViewer** component provides:\n\n## Features\n\n- **Split View**: Prompt on left, response on right\n- **Markdown Rendering**: Full GFM support with `react-markdown`\n- **Syntax Highlighting**: Code blocks via `rehype-highlight`\n- **Metadata Panel**: Expandable sidebar with timestamps, tokens, etc.\n- **Navigation**: Prev/Next buttons for session navigation\n- **Copy to Clipboard**: One-click copy for prompt or response\n- **Export**: Individual interaction export (JSON/Markdown)\n\n## Architecture\n\n```\nInteractionViewer\n├── MarkdownViewer (prompt)\n├── MarkdownViewer (response)\n└── MetadataPanel (expandable)\n```',
      model: 'claude-3-5-sonnet-20241022',
      timestamp: '2024-10-28T12:36:15-06:00',
      tokens: 220,
      duration_ms: 1100,
    },
  ];
}
