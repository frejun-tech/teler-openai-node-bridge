import WebSocket from "ws";
import { AudioProcessor } from "../utils/audioProcessor";

export class Call {
    public callId?: string;
    public sessionCreated: boolean;
    public sessionUpdated: boolean;
    public audioProcessor: AudioProcessor;

    constructor() {
        this.sessionCreated = false;
        this.sessionUpdated = false;
        this.audioProcessor = new AudioProcessor();
    }
}