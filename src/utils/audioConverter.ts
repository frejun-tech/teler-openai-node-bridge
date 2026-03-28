export class AudioResampler {
    public resampleAudioLinear(inputBuffer: Buffer, inputRate: number, outputRate: number): Buffer {
        const inputSamples = new Int16Array(
            inputBuffer.buffer, 
            inputBuffer.byteOffset, 
            inputBuffer.length / 2
        );
        
        const ratio = inputRate / outputRate;
        const outputLength = Math.floor(inputSamples.length / ratio);
        const outputSamples = new Int16Array(outputLength);
        
        for (let i = 0; i < outputLength; i++) {
            const srcIndex = i * ratio;
            const srcIndexFloor = Math.floor(srcIndex);
            const srcIndexCeil = Math.min(srcIndexFloor + 1, inputSamples.length - 1);
            const fraction = srcIndex - srcIndexFloor;
            
            const sample1 = inputSamples[srcIndexFloor];
            const sample2 = inputSamples[srcIndexCeil];
            outputSamples[i] = Math.round(sample1 + (sample2 - sample1) * fraction);
        }
        
        return Buffer.from(outputSamples.buffer);
    }
}