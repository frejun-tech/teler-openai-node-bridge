import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { Socket } from 'net';
import { StreamConnector, StreamType } from '@frejun/teler';
import { config } from '../core/config';
import { callStreamHandler, remoteStreamHandler } from './streamHandlers';
import { waitForMessage } from './waitTimer';
import { initialInstructionPayload, instructions, remoteHeaders, sessionUpdateConfig } from '../core/openaiConfig';
import { Call } from '../models/call';

export const wss = new WebSocketServer({ noServer: true });



wss.on('connection', async (telerWs: WebSocket) => {
  console.info('Teler WebSocket connected');
  
  if (!config.openaiApiKey) {
    console.error('OPENAI_API_KEY not configured');
    telerWs.close(1008, 'OPENAI_API_KEY not configured');
    return;
  }

  const call = new Call();
  const connector = new StreamConnector(
    config.openaiWsUrl,
    StreamType.BIDIRECTIONAL,
    callStreamHandler(call),
    remoteStreamHandler(call),
    remoteHeaders
  );
  
  const remoteWs = await connector.bridgeStream(telerWs);

  remoteWs.on('open', async () => {
    console.info(' Connected to OpenAI WebSocket');

    const sessionCreated = await waitForMessage(remoteWs, 'session.created');

    if (!sessionCreated) {
      console.error('Failed to create OpenAI session');
      telerWs.close(1011, 'OpenAI session setup failed');
      return;
    }

    console.info(`OpenAI session created: ${sessionCreated.session?.id}`);

    if (!call.sessionUpdated) {
      remoteWs.send(JSON.stringify(sessionUpdateConfig));
      await waitForMessage(remoteWs, 'session.updated');
      call.sessionUpdated = true;
      remoteWs.send(JSON.stringify(initialInstructionPayload));
      remoteWs.send(JSON.stringify({
        type: 'response.create',
        response: {
          instructions,
        },
      }));
    }
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