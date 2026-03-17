import * as alawmulaw from 'alawmulaw';

const CHUNK_SIZE = 320;

export class AudioResampler {
  private upsampleBuffer = Buffer.alloc(0);
  private downsampleBuffer = Buffer.alloc(0);

  upsample(base64Input: string): string | null {
    try {
      this.upsampleBuffer = Buffer.concat([
        this.upsampleBuffer,
        Buffer.from(base64Input, 'base64')
      ]);

      const chunks: Buffer[] = [];
      while (this.upsampleBuffer.length >= CHUNK_SIZE) {
        const chunk = Buffer.from(this.upsampleBuffer.subarray(0, CHUNK_SIZE));
        this.upsampleBuffer = Buffer.from(this.upsampleBuffer.subarray(CHUNK_SIZE));

        const samples = new Int16Array(
          chunk.buffer,
          chunk.byteOffset,
          chunk.length / 2
        );
        chunks.push(Buffer.from(alawmulaw.mulaw.encode(samples)));
      }

      if (chunks.length === 0) return null;
      return Buffer.concat(chunks).toString('base64');
    } catch (err) {
      console.error('[AudioResampler] upsample error:', err);
      return null;
    }
  }

  downsample(base64Input: string): string | null {
    try {
      this.downsampleBuffer = Buffer.concat([
        this.downsampleBuffer,
        Buffer.from(base64Input, 'base64')
      ]);

      const chunks: Buffer[] = [];
      while (this.downsampleBuffer.length >= CHUNK_SIZE / 2) {
        const chunk = Buffer.from(this.downsampleBuffer.subarray(0, CHUNK_SIZE / 2));
        this.downsampleBuffer = Buffer.from(this.downsampleBuffer.subarray(CHUNK_SIZE / 2));

        const l16Samples = alawmulaw.mulaw.decode(chunk);
        chunks.push(Buffer.from(l16Samples.buffer));
      }

      if (chunks.length === 0) return null;
      return Buffer.concat(chunks).toString('base64');
    } catch (err) {
      console.error('[AudioResampler] downsample error:', err);
      return null;
    }
  }

  reset(): void {
    this.upsampleBuffer = Buffer.alloc(0);
    this.downsampleBuffer = Buffer.alloc(0);
  }
}