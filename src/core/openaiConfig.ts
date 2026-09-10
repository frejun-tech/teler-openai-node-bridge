import { config } from "./config";

export const sessionUpdateConfig = {
  type: "session.update",

  session: {
    type: "realtime",
    model: "gpt-realtime-2.1",

    audio: {
      input: {
        format: {
          type: "audio/pcm",
          rate: 24000,
        },

        noise_reduction: {
          type: "near_field",
        },

        turn_detection: {
          type: "server_vad",
          threshold: 0.55,
          prefix_padding_ms: 300,
          silence_duration_ms: 600,
          create_response: true,
          interrupt_response: true,
        },

        transcription: {
          model: "gpt-transcribe",
        },
      },

      output: {
        format: {
          type: "audio/pcm",
          rate: 24000,
        },
      },
    },

    output_modalities: ["audio"],
  },
};

export const initialInstructionPayload = {
  type: "conversation.item.create",
  item: {
      type: "message",
      role: "system",
      content: [
          {
              type: "input_text",
              text: "Say hello and greet the customer in one short sentence.",
          }
      ],
  },
}
export const instructions = 'Greet the user warmly in one short sentence. Keep your voice stable. Speak english.';

export const remoteHeaders: Record<string, string> = { Authorization: `Bearer ${config.openaiApiKey}` };
