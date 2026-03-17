import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { Socket } from 'net';
import { StreamConnector, StreamType } from '@frejun/teler';
import { config } from '../core/config';
import { callStreamHandler, remoteStreamHandler } from './streamHandlers';

export const wss = new WebSocketServer({ noServer: true });

const remoteHeaders: Record<string, string> = { Authorization: `Bearer ${config.openaiApiKey}` };
const connector = new StreamConnector(
    config.openaiWsUrl,
    StreamType.BIDIRECTIONAL,
    callStreamHandler,
    remoteStreamHandler(),
    remoteHeaders
);


wss.on('connection', async (telerWs: WebSocket) => {
  console.info('[media-stream] Teler WebSocket connected');

  if (!config.openaiApiKey) {
    console.error('[media-stream] OPENAI_API_KEY not configured');
    telerWs.close(1008, 'OPENAI_API_KEY not configured');
    return;
  }
  
  const remoteWs = await connector.bridgeStream(telerWs as any);

  remoteWs.on('open', async () => {
      console.info('[media-stream] Connected to OpenAI WebSocket');

      remoteWs.send(JSON.stringify({
          type: 'session.update',
          session: {
              type: 'realtime',
              instructions: 'You are an AI assistant. Be extra kind today. Speak in English and keep your voice stable.',
              output_modalities: ['audio'],
              audio: {
                input: {
                  format: { type: 'audio/pcmu' },
                  turn_detection: { type: 'semantic_vad' },
                },
                output: {
                  format: { type: 'audio/pcmu'},
                  voice: 'marin',
                },
              },
          },
      }));

      const sessionCreated = await waitForMessage(remoteWs, 'session.created');
      if (!sessionCreated) {
          console.error('[media-stream] Failed to create OpenAI session');
          telerWs.close(1011, 'OpenAI session setup failed');
          return;
      }

      console.info(`[media-stream] OpenAI session created: ${sessionCreated?.session?.id}`);

      remoteWs.send(JSON.stringify({
          type: 'response.create',
          response: {
              instructions: 'Greet the user warmly in one short sentence. Keep your voice stable. Speak english.',
          },
      }));
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