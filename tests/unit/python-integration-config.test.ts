import { expect, test } from '@jest/globals';

// Utility to load module fresh with current env
async function loadModule() {
  jest.resetModules();
  return await import('../../server/python-integration');
}

test('PY_BACKEND uses environment variable when provided', async () => {
  process.env.PYTHON_BACKEND_URL = 'http://example.com:9000';
  const mod = await loadModule();
  expect(mod.PY_BACKEND).toBe('http://example.com:9000');
});

test('PY_BACKEND falls back to localhost when env not set', async () => {
  delete process.env.PYTHON_BACKEND_URL;
  const mod = await loadModule();
  expect(mod.PY_BACKEND).toBe('http://localhost:8000');
});
