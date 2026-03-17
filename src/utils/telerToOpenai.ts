import { WebSocket } from "ws";
import { AudioResampler } from './audioResampler';

const audioResampler = new AudioResampler();

async function telerToOpenai(openaiWs: WebSocket, telerWs: WebSocket): Promise<void> {

  telerWs.on('message', async (raw) => {
    let data: Record<string, any>;
    try {
      data = JSON.parse(raw.toString());
    } catch {
      console.error('[media-stream][teler] Failed to parse message');
      return;
    }

    if (data.type !== 'audio') return;

    const audioB64: string = data?.data?.audio_b64;
    if (!audioB64) {
      console.warn('[media-stream][teler] Missing audio_b64 in audio message');
      return;
    }

    try {
      const audio24kB64 = audioResampler.upsampleBase64(audioB64, 16000, 24000);

      if (!audio24kB64) {
        console.warn('[media-stream][teler] Upsampling returned null, skipping chunk');
        return;
      }

      openaiWs.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: audio24kB64,
      }));
    } catch (err: any) {
      console.error(`[media-stream][teler] Audio processing error: ${err.message}`);
    }
  });

  telerWs.on('close', () => {
    console.error('[media-stream][teler] Teler WebSocket disconnected.');
  });

  telerWs.on('error', (err: Error) => {
    console.error(`[media-stream][teler] telerToOpenai error: ${err.name}: ${err.message}`);
  });
}

export { telerToOpenai };