// The single switch between the two builds. VITE_STANDALONE is replaced at
// build time, so the sql.js/WASM engine below is dead-code-eliminated from
// the server build (verified: no .wasm in dist/) and fetch() never appears
// in the standalone bundle's runtime path.

let api = null;

export async function initApi() {
  if (import.meta.env.VITE_STANDALONE) {
    const { createLocalApi } = await import('./local.js');
    api = await createLocalApi();
  } else {
    const { createRemoteApi } = await import('./remote.js');
    api = createRemoteApi();
  }
  return api;
}

export function getApi() {
  if (!api) throw new Error('API not initialised yet');
  return api;
}

export const IS_STANDALONE = !!import.meta.env.VITE_STANDALONE;
