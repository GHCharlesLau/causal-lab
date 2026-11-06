import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const dag = require('../assets/js/dag.js');

test('chapter 4: three graph scenarios', () => {
  assert.deepEqual(Object.keys(dag.scenarios), ['confounding', 'collider', 'mediator']);
  for (const scenario of Object.values(dag.scenarios)) {
    assert.equal(scenario.nodes.length, 3);
    assert.ok(scenario.edges.length >= 2);
  }
});

test('chapter 4: confounding opens by default, closes on intelligence', () => {
  const open = dag.evaluate('confounding', {});
  const closed = dag.evaluate('confounding', { I: true });
  assert.equal(open.status, 'bias');
  assert.equal(open.paths[0].open, true);
  assert.equal(closed.status, 'ok');
  assert.equal(closed.paths[0].open, false);
  assert.match(closed.headline, /Backdoor closed/);
});

test('chapter 4: collider is closed by default, opens on investments', () => {
  const closed = dag.evaluate('collider', {});
  const open = dag.evaluate('collider', { I: true });
  assert.equal(closed.status, 'ok');
  assert.equal(closed.paths[0].open, false);
  assert.equal(open.status, 'bias');
  assert.equal(open.paths[0].open, true);
  assert.match(open.headline, /Selection bias/);
});

test('chapter 4: mediator is open by default, blocked when conditioned', () => {
  const open = dag.evaluate('mediator', {});
  const blocked = dag.evaluate('mediator', { C: true });
  assert.equal(open.status, 'ok');
  assert.equal(open.paths[0].open, true);
  assert.equal(blocked.status, 'warn');
  assert.equal(blocked.paths[0].open, false);
  assert.match(blocked.headline, /Mediator blocked/);
});

test('chapter 4: unknown scenario returns null', () => {
  assert.equal(dag.evaluate('nope', {}), null);
});
