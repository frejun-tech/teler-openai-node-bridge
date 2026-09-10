import { StreamHandlerResult, StreamOP } from "@frejun/teler";
import { Call } from "../models/call";
import { config } from "../core/config";


export const callStreamHandler = (call: Call) => {
    const handler = async (message: string): Promise<StreamHandlerResult> => {
        try {
            const data = JSON.parse(message);

            if(data["type"] === "audio") {
                const audioB64: string = data?.data?.audio_b64;
                if (!audioB64) {
                    return ['', StreamOP.PASS];
                }

                const audioBuffer = Buffer.from(audioB64, "base64");
                
                const audio = call.audioProcessor.upsample(audioBuffer);
                if (!audio) {
                    return ['', StreamOP.PASS];
                }

                const payload = JSON.stringify({
                    type: 'input_audio_buffer.append',
                    audio: audio.toString("base64"),
                });

                return [payload, StreamOP.RELAY];

            }
            return ['', StreamOP.PASS];
        } catch(err) {
            console.info("Error in call stream handler", err);
            return ['', StreamOP.PASS];
        }
    }

    return handler;
}

export const remoteStreamHandler = (call: Call) => {
    let chunkId = 1;
    let messageBuffer: Buffer[] = [];

    function _flush_buffer() {
        const audioData = Buffer.concat(messageBuffer);
        const resampledAudio = call.audioProcessor.downsample(audioData);

        const payload = JSON.stringify({
            "type": "audio",
            "audio_b64": resampledAudio.toString('base64'),
            "chunk_id": chunkId++,
        });
        messageBuffer.length = 0;
        return payload;
    }
    
    const handler = async(message: string): Promise<StreamHandlerResult> => {
        try {
            let data: Record<string, any>;
            data = JSON.parse(message.toString());
            
            const msgType: string = data.type ?? 'unknown';

            if (msgType === 'response.output_audio.delta') {
                const audioData: string = data.delta ?? '';
                if (!audioData) {
                    return ['', StreamOP.PASS];
                }

                messageBuffer.push(Buffer.from(audioData, 'base64'));

                if (messageBuffer.length >= config.bufferSize) {
                    return [_flush_buffer(), StreamOP.RELAY];
                }

                
            } else if (msgType === 'input_audio_buffer.speech_started') {
                messageBuffer.length = 0;
                const payload = JSON.stringify({"type": "clear"});
                return [payload, StreamOP.RELAY];
            } else if (msgType === 'response.output_audio.done') {
                return [_flush_buffer(), StreamOP.RELAY];
            } if (data.type === "conversation.item.input_audio_transcription.completed") {
                console.log("TRANSCRIPT:", data.transcript);
            } else if (msgType === 'error') {
                console.error('OpenAI error:', data.error ?? {});
            }

            return ['', StreamOP.PASS];
        } catch (err) {
            console.info("Error in remote stream handler", err);
            return ['', StreamOP.PASS];
        }
    }

    return handler;
}