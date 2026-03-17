import { StreamHandlerResult, StreamOP } from "@frejun/teler";
import { AudioResampler } from "./audioResampler";

const audioResampler = new AudioResampler();

export const callStreamHandler = async (message: string): Promise<StreamHandlerResult> => {
    try {
        const data = JSON.parse(message);

        if(data["type"] === "audio") {
            const audioB64: string = data?.data?.audio_b64;
            if (!audioB64) {
                return ['', StreamOP.PASS];
            }
            
            const audioPCMUB64 = audioResampler.upsample(audioB64);
            if (!audioPCMUB64) {
                return ['', StreamOP.PASS];
            }

            const payload = JSON.stringify({
                type: 'input_audio_buffer.append',
                audio: audioPCMUB64,
            });

            return [payload, StreamOP.RELAY];

        }
        return ['', StreamOP.PASS];
    } catch(err) {
        console.log("Error in call stream handler", err);
        return ['', StreamOP.PASS];
    }
}

export const remoteStreamHandler = () => {
    let chunkId = 1;
    
    const handler = async(message: string): Promise<StreamHandlerResult> => {
        try {
            let data: Record<string, any>;
            data = JSON.parse(message.toString());
            
            const msgType: string = data.type ?? 'unknown';

            if (msgType === 'response.output_audio.delta') {
                const audioB64: string = data.delta ?? '';
                if (!audioB64) {
                    return ['', StreamOP.PASS];
                }

                console.log('[debug] chunk received at:', Date.now(), 'size:', audioB64.length);

                const audioPCMUB64 = audioResampler.downsample(audioB64);
                if (!audioPCMUB64) {
                    return ['', StreamOP.PASS];
                }

                const payload = JSON.stringify({
                    "type": "audio",
                    "audio_b64": audioPCMUB64,
                    "chunk_id": chunkId++,
                });
                console.log("Sent audio to Teler");
                return [payload, StreamOP.RELAY];
                
            } else if (msgType === 'input_audio_buffer.speech_started') {
                const payload = JSON.stringify({
                    "type": "clear"
                });
                return [payload, StreamOP.RELAY];
                
            } else if (msgType === 'error') {
                console.error('[media-stream][openai] OpenAI error:', data.error ?? {});
            }

            return ['', StreamOP.PASS];
        } catch (err) {
            console.log("Error in remote stream handler", err);
            return ['', StreamOP.PASS];
        }
    }

    return handler;
}