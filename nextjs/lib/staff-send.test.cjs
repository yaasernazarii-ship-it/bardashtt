const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');

const routes = [
  'reports/route.js',
  'reports/[id]/route.js',
  'chat/[id]/route.js',
  'chat-groups/[id]/messages/route.js',
];

async function loadRoute(route, { role = 'admin', locked = false } = {}) {
  const calls = [];
  const user = role ? { id: 'sender', role } : null;
  const isManager = (u) => !!u && ['admin', 'editor'].includes(u.role);
  const row = { id: 'item', authorId: 'sender', createdAt: new Date(), comments: [] };
  const create = async () => { calls.push('write'); return row; };
  const nothing = async () => {};
  const clean = (value, max) => String(value || '').trim().slice(0, max);
  const exports = {
    prisma: {
      staffReport: { create, findUnique: async () => row },
      staffReportComment: { create },
      staffChatThread: { findUnique: async () => ({ id: 'item', kind: 'group' }), update: nothing },
      staffChatMessage: { findFirst: async () => null, create },
      chatGroup: { findUnique: async () => row },
    },
    getSessionUser: async () => user,
    isManager,
    logAction: nothing,
    notifyUsers: nothing,
    isLocked: async () => {
      await new Promise((r) => setImmediate(r));
      calls.push('check');
      return locked;
    },
    recordFailure: async () => {
      await new Promise((r) => setImmediate(r));
      calls.push('count');
    },
    CATEGORIES: { report: 'report' },
    LIMITS: { title: 120, body: 4000, comment: 2000 },
    cleanText: clean,
    displayNameOf: () => 'Test sender',
    listColleagues: async () => [],
    otherManagerIds: async () => [],
    resolveTarget: async () => ({ targetId: null, targetName: null }),
    serializeReport: (r) => r,
    CHAT_LIMITS: { message: 2000 },
    NOTIFY_GAP_MS: 1000,
    canAccessThread: isManager,
    markThreadRead: nothing,
    notifyTargetsOf: async () => [],
    peerIdOf: () => null,
    serializeMessage: (r) => r,
    GROUP_LIMITS: { message: 2000 },
    cleanBody: clean,
    markGroupRead: nothing,
    messagesOf: async () => [],
    postMessage: create,
    requireManager: async () => isManager(user) ? { user } : {
      error: Response.json({ ok: false }, { status: user ? 403 : 401 }),
    },
    serializeGroup: (r) => r,
  };
  const context = vm.createContext({ Response, URL, Date, Promise, setImmediate });
  const source = readFileSync(resolve(__dirname, '../app/api/admin', route), 'utf8');
  const module = new vm.SourceTextModule(source, { context });
  await module.link((specifier, importing) => {
    const names = [...source.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g)]
      .filter((match) => match[2] === specifier)
      .flatMap((match) => match[1].split(',').map((n) => n.trim()).filter(Boolean));
    return new vm.SyntheticModule(names, function () {
      for (const name of names) {
        assert.ok(name in exports, `Missing mock: ${name}`);
        this.setExport(name, exports[name]);
      }
    }, { context: importing.context });
  });
  await module.evaluate();
  const send = (body) => module.namespace.POST(new Request('http://test.local/api/admin/test', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }), { params: Promise.resolve({ id: 'item' }) });
  return { send, calls };
}

for (const route of routes) {
  for (const role of ['admin', 'editor']) {
    test(`${route}: ${role} can send after async limiter resolves false`, async () => {
      const { send, calls } = await loadRoute(route, { role });
      const res = await send({ title: 'Test ticket', body: 'Test message' });
      assert.equal(res.status, 200);
      assert.equal((await res.json()).ok, true);
      assert.deepEqual(calls, ['check', 'count', 'write']);
    });
  }
  test(`${route}: real rate limit still blocks writes`, async () => {
    const { send, calls } = await loadRoute(route, { locked: true });
    assert.equal((await send({ title: 'Test ticket', body: 'Test message' })).status, 429);
    assert.deepEqual(calls, ['check']);
  });
  test(`${route}: empty input does not write or consume allowance`, async () => {
    const { send, calls } = await loadRoute(route);
    assert.equal((await send({ title: '', body: '' })).status, 400);
    assert.deepEqual(calls, ['check']);
  });
  for (const role of [null, 'student']) {
    test(`${route}: ${role || 'guest'} cannot send`, async () => {
      const { send, calls } = await loadRoute(route, { role });
      assert.equal((await send({ title: 'Test ticket', body: 'Test message' })).status, role ? 403 : 401);
      assert.deepEqual(calls, []);
    });
  }
}
