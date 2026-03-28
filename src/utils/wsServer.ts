import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { Socket } from 'net';
import { StreamConnector, StreamType } from '@frejun/teler';
import { config } from '../core/config';
import { callStreamHandler, remoteStreamHandler } from './streamHandlers';
import { waitForMessage } from './waitTimer';
import { instructions, remoteHeaders, sessionUpdateConfig } from '../core/openaiConfig';

export const wss = new WebSocketServer({ noServer: true });

const connector = new StreamConnector(
  config.openaiWsUrl,
  StreamType.BIDIRECTIONAL,
  callStreamHandler,
  remoteStreamHandler(),
  remoteHeaders
);


wss.on('connection', async (telerWs: WebSocket) => {
  console.info('Teler WebSocket connected');

  if (!config.openaiApiKey) {
    console.error('OPENAI_API_KEY not configured');
    telerWs.close(1008, 'OPENAI_API_KEY not configured');
    return;
  }
  
  const remoteWs = await connector.bridgeStream(telerWs);

  remoteWs.on('open', async () => {
    console.info(' Connected to OpenAI WebSocket');

    remoteWs.send(JSON.stringify({
      type: 'session.update',
      session: sessionUpdateConfig,
    }));

    const sessionCreated = await waitForMessage(remoteWs, 'session.created');
    if (!sessionCreated) {
      console.error(' Failed to create OpenAI session');
      telerWs.close(1011, 'OpenAI session setup failed');
      return;
    }

    console.info(` OpenAI session created: ${sessionCreated?.session?.id}`);

    remoteWs.send(JSON.stringify({
      type: 'response.create',
      response: {
        instructions: instructions,
      },
    }));
  });

});

export const handleUpgrade = (request: IncomingMessage, socket: Socket, head: Buffer) => {
  if (request.url === '/api/v1/media-stream') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws);
    });
  } else {
    socket.destroy();
  }
};