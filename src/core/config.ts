import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port:                   Number(process.env.PORT) || 8000,
    nodeEnv:                process.env.NODE_ENV || 'development',
    serverDomain:           process.env.SERVER_DOMAIN || '',
    telerKey:               process.env.TELER_API_KEY || '',
    openaiWsUrl:            process.env.OPENAI_WS_URL || '',
    openaiSampleRate:       process.env.OPENAI_SAMPLE_RATE || '16k',
    openaiApiKey:           process.env.OPENAI_API_KEY || '',
} as const;