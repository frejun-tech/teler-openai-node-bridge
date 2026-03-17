import { StreamHandlerResult, StreamOP } from "@frejun/teler";
import { AudioConverter } from "./audioConverter";

const audioConverter = new AudioConverter();

export const callStreamHandler = async (message: string): Promise<StreamHandlerResult> => {
    try {
        const data = JSON.parse(message);

        if(data["type"] === "audio") {
            const audioB64: string = data?.data?.audio_b64;
            if (!audioB64) {
                return ['', StreamOP.PASS];
            }
            
            const audio = audioConverter.encode(audioB64);
            if (!audio) {
                return ['', StreamOP.PASS];
            }

            const payload = JSON.stringify({
                type: 'input_audio_buffer.append',
                audio: audio,
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

                const audio = audioConverter.decode(data.delta);
                if (!audio) {
                    return ['', StreamOP.PASS];
                }

                const payload = JSON.stringify({
                    "type": "audio",
                    "audio_b64": audio,
                    "chunk_id": chunkId++,
                });
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