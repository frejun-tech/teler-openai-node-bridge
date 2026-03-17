import * as alawmulaw from 'alawmulaw';

const CHUNK_SIZE = 320;

export class AudioConverter {
  private encodeBuffer = Buffer.alloc(0);
  private decodeBuffer = Buffer.alloc(0);

  // converts PCM to PCMU
  encode(base64Input: string): string | null {
    try {
      this.encodeBuffer = Buffer.concat([
        this.encodeBuffer,
        Buffer.from(base64Input, 'base64')
      ]);

      const chunks: Buffer[] = [];
      while (this.encodeBuffer.length >= CHUNK_SIZE) {
        const chunk = Buffer.from(this.encodeBuffer.subarray(0, CHUNK_SIZE));
        this.encodeBuffer = Buffer.from(this.encodeBuffer.subarray(CHUNK_SIZE));
        const samples = new Int16Array(chunk.buffer, chunk.byteOffset, chunk.length / 2);
        chunks.push(Buffer.from(alawmulaw.mulaw.encode(samples)));
      }

      if (chunks.length === 0) return null;
      return Buffer.concat(chunks).toString('base64');
    } catch (err) {
      console.error('[AudioConverter] encode error:', err);
      return null;
    }
  }

  // converts PCMU to PCM
  decode(base64Input: string): string | null {
    try {
      this.decodeBuffer = Buffer.concat([
        this.decodeBuffer,
        Buffer.from(base64Input, 'base64')
      ]);

      const chunks: Buffer[] = [];
      while (this.decodeBuffer.length >= CHUNK_SIZE / 2) {
        const chunk = Buffer.from(this.decodeBuffer.subarray(0, CHUNK_SIZE / 2));
        this.decodeBuffer = Buffer.from(this.decodeBuffer.subarray(CHUNK_SIZE / 2));
        const l16Samples = alawmulaw.mulaw.decode(chunk);
        chunks.push(Buffer.from(l16Samples.buffer));
      }

      if (chunks.length === 0) return null;
      return Buffer.concat(chunks).toString('base64');
    } catch (err) {
      console.error('[AudioConverter] decode error:', err);
      return null;
    }
  }

  reset(): void {
    this.encodeBuffer = Buffer.alloc(0);
    this.decodeBuffer = Buffer.alloc(0);
  }
}