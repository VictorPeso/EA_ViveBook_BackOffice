type ViveBookRuntimeEnvironment = typeof globalThis & {
  __VIVEBOOK_ENV__?: {
    apiUrl?: string;
  };
};

const runtimeEnvironment = globalThis as ViveBookRuntimeEnvironment;

export const environment = {
  apiUrl: runtimeEnvironment.__VIVEBOOK_ENV__?.apiUrl || 'http://localhost:1337',
};
