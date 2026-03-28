import WebSocket from "ws";

export function waitForMessage(
    ws: WebSocket,
    expectedType: string,
    timeoutMs = 5000
): Promise<Record<string, any> | null> {
  return new Promise((resolve) => {

    const timer = setTimeout(() => {
      ws.off('message', handler);
      console.warn(`Timeout waiting for '${expectedType}'`);
      resolve(null);
    }, timeoutMs);

    const handler = (raw: any) => {
      const data = JSON.parse(raw.toString());

      if (data.type !== expectedType) {
        console.warn(` Skipping: ${data.type}`);
        return;
      }

      clearTimeout(timer);
      ws.off('message', handler);
      resolve(data);
    };

    ws.on('message', handler);
  });
}
