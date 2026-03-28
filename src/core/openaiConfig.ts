import { config } from "./config";

export const sessionUpdateConfig = {
    type: 'realtime',
    instructions: 'You are an AI assistant. Be extra kind today. Speak in English and keep your voice stable.',
    output_modalities: ['audio'],
    audio: {
    input: {
        format: {
            "type": "audio/pcm",
            "rate": 24000
        }
    },
    output: {
        format: { 
            type: "audio/pcm",
            rate: 24000
        },
    },
    },
};

export const instructions = 'Greet the user warmly in one short sentence. Keep your voice stable. Speak english.';

export const remoteHeaders: Record<string, string> = { Authorization: `Bearer ${config.openaiApiKey}` };
