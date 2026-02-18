// Suprik AI Worker — Cloudflare Workers AI proxy
// Routes:
//   POST /  — LLM chat (streaming SSE)

interface Env {
  AI: Ai;
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// --- LLM Chat ---

const MODEL = '@cf/meta/llama-3.1-8b-instruct';

async function handleChat(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as {
    messages: Array<{ role: string; content: string }>;
    stream?: boolean;
  };

  if (!body.messages || !Array.isArray(body.messages)) {
    return new Response(JSON.stringify({ error: 'messages array required' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const messages = body.messages.slice(-11);

  if (body.stream !== false) {
    const stream = await env.AI.run(MODEL, {
      messages,
      stream: true,
      max_tokens: 1024,
    });

    return new Response(stream as ReadableStream, {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
  } else {
    const result = await env.AI.run(MODEL, {
      messages,
      max_tokens: 1024,
    }) as { response: string };

    return new Response(JSON.stringify({ response: result.response }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
}

// --- Router ---

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
    }

    try {
      return await handleChat(request, env);
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message || 'Request failed' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
  },
} satisfies ExportedHandler<Env>;
