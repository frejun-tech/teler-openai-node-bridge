import { StreamHandlerResult, StreamOP } from "teler-sdk-node";

export const callStreamHandler = async (message: string): Promise<StreamHandlerResult> => {
    try {
        const data = JSON.parse(message);

        if(data["type"] === "audio") {
            const payload: string = JSON.stringify({
                "user_audio_chunk": data["data"]["audio_b64"]
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
    let chunk_id = 1

    const handler = async(message: string): Promise<StreamHandlerResult> => {
        try {
            const data = JSON.parse(message);

            if(data["type"] === "audio") {
                const payload = JSON.stringify({
                    "type": "audio",
                    "audio_b64": data["audio_event"]["audio_base_64"],
                    "chunk_id": chunk_id,
                })
                chunk_id++;
                return [payload, StreamOP.RELAY];

            } else if (data["type"] == "interruption") {
                const payload = JSON.stringify({"type": "clear"});
                return [payload, StreamOP.RELAY];
            } 

            return ['', StreamOP.PASS];
        } catch (err) {
            console.log("Error in remote stream handler", err);
            return ['', StreamOP.PASS];
        }
    }

    return handler;
}