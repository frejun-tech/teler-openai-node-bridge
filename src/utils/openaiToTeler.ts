import { WebSocket } from "ws";
import { AudioResampler } from './audioResampler';

const audioResampler = new AudioResampler();

async function openaiToTeler(openaiWs: WebSocket, telerWs: WebSocket): Promise<void> {
  let chunkId = 0;

  openaiWs.on('message', async (raw) => {
    let data: Record<string, any>;
    try {
      data = JSON.parse(raw.toString());
    } catch {
      console.error('[media-stream][openai] Failed to parse message');
      return;
    }

    const msgType: string = data.type ?? 'unknown';

    if (msgType === 'response.output_audio.delta') {
      const audioB64: string = data.delta ?? '';
      if (!audioB64) return;

      const audio8kB64 = audioResampler.downsampleBase64(audioB64);
      if (!audio8kB64) return;

      telerWs.send(JSON.stringify({
        type: 'audio',
        audio_b64: audio8kB64,
        chunk_id: chunkId++,
      }));
      console.log("Sent audio to Teler");

    } else if (msgType === 'input_audio_buffer.speech_started') {
      telerWs.send(JSON.stringify({ type: 'clear' }));

    } else if (msgType === 'error') {
      console.error('[media-stream][openai] OpenAI error:', data.error ?? {});
    }
  });

  telerWs.on('close', () => {
    console.error('[media-stream][teler] Teler WebSocket disconnected.');
  });

  openaiWs.on('close', () => {
    console.debug('[media-stream][openai] OpenAI WebSocket closed.');
  });

  openaiWs.on('error', (err: Error) => {
    console.error(`[media-stream][openai] Error: ${err.name}: ${err.message}`);
  });
}

export { openaiToTeler };