// Run with: node --test tests/offline-queue.cjs
// TypeScript is already a project devDependency; no native runtime is needed.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');

const source = readFileSync(join(__dirname, '../lib/offline.ts'), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    esModuleInterop: true,
  },
});

const queueKey = '@offline_sync_queue';

function operation(id, retries = 0) {
  return {
    id,
    type: 'update',
    table: 'synthetic_records',
    payload: { value: id },
    createdAt: '2026-01-01T00:00:00.000Z',
    retries,
  };
}

function loadOffline(initialQueue, online = true) {
  const storage = new Map([[queueKey, JSON.stringify(initialQueue)]]);
  const exports = {};
  const mocks = {
    react: {}, // These tests exercise queue functions, never React hooks.
    '@react-native-community/netinfo': {
      fetch: async () => ({ isConnected: online, isInternetReachable: online }),
    },
    '@react-native-async-storage/async-storage': {
      getItem: async (key) => storage.get(key) ?? null,
      setItem: async (key, value) => { storage.set(key, value); },
      removeItem: async (key) => { storage.delete(key); },
    },
  };

  runInNewContext(outputText, {
    exports,
    require(name) {
      assert.ok(Object.hasOwn(mocks, name), `Unexpected dependency: ${name}`);
      return mocks[name];
    },
  }, { filename: 'lib/offline.ts' });

  return {
    api: exports,
    readQueue: () => JSON.parse(storage.get(queueKey) ?? '[]'),
  };
}

test('persists a retry when the sync handler returns false', async () => {
  const { api, readQueue } = loadOffline([operation('failed')]);
  const result = await api.processQueue(async () => false);

  assert.equal(result.synced, 0);
  assert.equal(result.failed, 1);
  assert.deepEqual(readQueue(), [operation('failed', 1)]);
});

test('persists a retry when the sync handler throws', async () => {
  const { api, readQueue } = loadOffline([operation('failed', 2)]);
  const result = await api.processQueue(async () => { throw new Error('Synthetic failure'); });

  assert.equal(result.failed, 1);
  assert.deepEqual(readQueue(), [operation('failed', 3)]);
});

test('repeated failed passes accumulate retries across storage reads', async () => {
  const { api, readQueue } = loadOffline([operation('failed')]);
  await api.processQueue(async () => false);
  await api.processQueue(async () => false);

  assert.deepEqual(readQueue(), [operation('failed', 2)]);
});

test('removes successful operations while persisting retries for both failure paths', async () => {
  const { api, readQueue } = loadOffline([
    operation('false', 1), operation('success'), operation('throw', 3),
  ]);
  const result = await api.processQueue(async (op) => {
    if (op.id === 'throw') throw new Error('Synthetic failure');
    return op.id === 'success';
  });

  assert.equal(result.synced, 1);
  assert.equal(result.failed, 2);
  assert.deepEqual(readQueue(), [operation('false', 2), operation('throw', 4)]);
});

test('preserves an operation added while the current queue is syncing', async () => {
  const { api, readQueue } = loadOffline([operation('failed')]);
  const visited = [];
  await api.processQueue(async (op) => {
    visited.push(op.id);
    await api.enqueueOperation('create', 'synthetic_records', { value: 'new' });
    return false;
  });

  const queue = readQueue();
  assert.deepEqual(visited, ['failed']);
  assert.equal(queue.length, 2);
  assert.deepEqual(queue[0], operation('failed', 1));
  assert.equal(queue[1].retries, 0);
  assert.deepEqual(queue[1].payload, { value: 'new' });
});

test('does not restore an operation removed while syncing', async () => {
  const { api, readQueue } = loadOffline([operation('removed'), operation('failed')]);
  await api.processQueue(async (op) => {
    if (op.id === 'removed') await api.dequeueOperation(op.id);
    return false;
  });

  assert.deepEqual(readQueue(), [operation('failed', 1)]);
});

test('does not invoke the handler or modify the queue while offline', async () => {
  const initial = [operation('pending', 2)];
  const { api, readQueue } = loadOffline(initial, false);
  const result = await api.processQueue(async () => assert.fail('Must stay offline'));

  assert.equal(result.synced, 0);
  assert.equal(result.failed, 0);
  assert.deepEqual(readQueue(), initial);
});

test('a successful later pass removes the previously retried operation', async () => {
  const { api, readQueue } = loadOffline([operation('recovered')]);
  await api.processQueue(async () => false);
  assert.equal(readQueue()[0].retries, 1);
  const result = await api.processQueue(async () => true);

  assert.equal(result.synced, 1);
  assert.equal(result.failed, 0);
  assert.deepEqual(readQueue(), []);
});
