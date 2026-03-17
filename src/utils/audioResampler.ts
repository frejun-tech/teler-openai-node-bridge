export class AudioResampler {

  downsampleBase64(b64String: string): string | null {
    try {
      const inputBuffer = Buffer.from(b64String, 'base64');
      const sampleCount = Math.floor(inputBuffer.length / 2);
      const inputSamples = new Int16Array(sampleCount);
      for (let i = 0; i < sampleCount; i++) {
        inputSamples[i] = inputBuffer.readInt16LE(i * 2);
      }

      const outputLength = Math.floor(inputSamples.length / 3);
      const outputSamples = new Int16Array(outputLength);
      for (let i = 0; i < outputLength; i++) {
        const avg = (
          (inputSamples[i * 3] ?? 0) +
          (inputSamples[i * 3 + 1] ?? 0) +
          (inputSamples[i * 3 + 2] ?? 0)
        ) / 3;
        outputSamples[i] = Math.round(avg);
      }

      const outputBuffer = Buffer.alloc(outputSamples.length * 2);
      for (let i = 0; i < outputSamples.length; i++) {
        outputBuffer.writeInt16LE(outputSamples[i], i * 2);
      }

      return outputBuffer.toString('base64');
    } catch (err: any) {
      console.error('[AudioResampler] downsampleBase64 error:', err.message);
      return null;
    }
  }

  upsampleBase64(b64String: string, srcRate: number, destRate: number): string | null {
    try {
      const inputBuffer = Buffer.from(b64String, 'base64');
      const sampleCount = Math.floor(inputBuffer.length / 2);
      const inputSamples = new Int16Array(sampleCount);
      for (let i = 0; i < sampleCount; i++) {
        inputSamples[i] = inputBuffer.readInt16LE(i * 2);
      }

      const ratio = destRate / srcRate;
      const outputLength = Math.floor(inputSamples.length * ratio);
      const outputSamples = new Int16Array(outputLength);

      for (let i = 0; i < outputLength; i++) {
        const srcPos = i / ratio;
        const srcIndex = Math.floor(srcPos);
        const frac = srcPos - srcIndex;

        const s0 = inputSamples[srcIndex] ?? 0;
        const s1 = inputSamples[srcIndex + 1] ?? s0;

        outputSamples[i] = Math.round(s0 + frac * (s1 - s0));
      }

      const outputBuffer = Buffer.alloc(outputSamples.length * 2);
      for (let i = 0; i < outputSamples.length; i++) {
        outputBuffer.writeInt16LE(outputSamples[i], i * 2);
      }

      return outputBuffer.toString('base64');
    } catch (err: any) {
      console.error('[AudioResampler] upsampleBase64 error:', err.message);
      return null;
    }
  }
}