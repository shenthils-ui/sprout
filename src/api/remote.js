// Server-build API: every store method becomes a POST /api/rpc call.
// Method names/params/results are identical to the standalone engine.

export class ServerUnreachableError extends Error {
  constructor() {
    super("Can't reach the Sprout server");
    this.name = 'ServerUnreachableError';
  }
}

export function createRemoteApi() {
  const call = async (method, params) => {
    let res;
    try {
      res = await fetch('/api/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, params }),
      });
    } catch {
      throw new ServerUnreachableError();
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `RPC ${method} failed`);
    return body.result;
  };

  return new Proxy({}, {
    get: (_t, method) => {
      if (method === 'then') return undefined; // don't look thenable
      return (params) => call(method, params);
    },
  });
}
