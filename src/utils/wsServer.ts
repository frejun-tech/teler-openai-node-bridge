import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { Socket } from 'net';
import { config } from '../core/config';
import { openaiToTeler } from './openaiToTeler';
import { telerToOpenai } from './telerToOpenai';

export const wss = new WebSocketServer({ noServer: true });

const remoteHeaders: Record<string, string> = { Authorization: `Bearer ${config.openaiApiKey}` };

wss.on('connection', async (telerWs: WebSocket) => {
  console.info('[media-stream] Teler WebSocket connected');

  if (!config.openaiApiKey) {
    console.error('[media-stream] OPENAI_API_KEY not configured');
    telerWs.close(1008, 'OPENAI_API_KEY not configured');
    return;
  }

  const openaiWs = new WebSocket(config.openaiWsUrl, {
    headers: remoteHeaders,
  });

  openaiWs.on('error', (err) => {
    console.error(`[media-stream] OpenAI WS error: ${err.message}`);
    telerWs.close(1011, 'OpenAI connection error');
  });

  openaiWs.on('open', async () => {
    console.info('[media-stream] Connected to OpenAI WebSocket');

    openaiWs.send(JSON.stringify({
      type: 'session.update',
      session: {
        type: 'realtime',
        instructions: "You are an AI assistant. Be extra kind today. Speak in English and keep you voice stable. No distorted voice.",
        output_modalities: ["audio"],
        audio: {
            input: {
                format: {
                    type: "audio/pcm",
                    rate: 24000,
                },
                turn_detection: {
                    type: "semantic_vad"
                }
                },
                output: {
                format: {
                    type: "audio/pcm",
                    rate: 24000,
                },
                voice: "marin",
            }
        },
      },
    }));

    const sessionCreated = await waitForMessage(openaiWs, 'session.created');
    if (!sessionCreated) {
      console.error('[media-stream] Failed to create OpenAI session');
      telerWs.close(1011, 'OpenAI session setup failed');
      return;
    }

    const sessionId = sessionCreated?.session?.id;
    console.info(`[media-stream] OpenAI session created: ${sessionId}`);

    openaiWs.send(JSON.stringify({
      type: 'response.create',
      response: {
        instructions: 'Greet the user warmly in one short sentence. Keep your voice stable.',
      },
    }));

    openaiToTeler(openaiWs, telerWs);
    telerToOpenai(openaiWs, telerWs);
  });

  telerWs.on('close', () => {
    console.info('[media-stream] Teler disconnected, closing OpenAI WS');
    if (openaiWs.readyState === WebSocket.OPEN) {
      openaiWs.close();
    }
  });
});

function waitForMessage(
  ws: WebSocket,
  expectedType: string,
  timeoutMs = 5000
): Promise<Record<string, any> | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      ws.removeListener('message', handler);
      console.error(`[media-stream] Timeout waiting for '${expectedType}'`);
      resolve(null);
    }, timeoutMs);

    const handler = (raw: any) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data.type === expectedType) {
          clearTimeout(timer);
          ws.removeListener('message', handler);
          resolve(data);
        } else {
          console.error(`[media-stream][openai] Unexpected message during setup: ${data.type}`);
        }
      } catch {
        clearTimeout(timer);
        ws.removeListener('message', handler);
        resolve(null);
      }
    };

    ws.on('message', handler);
  });
}

export const handleUpgrade = (
  request: IncomingMessage,
  socket: Socket,
  head: Buffer
) => {
  if (request.url === '/media-stream') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws);
    });
  } else {
    socket.destroy();
  }
};