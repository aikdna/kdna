import test from 'node:test';
import assert from 'node:assert/strict';
import { canonical, digest, project, compileTypes, closure } from './native-renderer.mjs';

test('metadata projection preserves array order and refuses changed preimages', () => {
  const value = { rules: ['keep', 'old', 'last'], private_note: 'remove' };
  const operations = [
    {
      action: 'replace',
      pointer: '/rules/1',
      expected_before_sha256: digest('old'),
      value: 'public',
    },
    { action: 'delete', pointer: '/private_note', expected_before_sha256: digest('remove') },
  ];
  assert.deepEqual(project(value, operations), { rules: ['keep', 'public', 'last'] });
  assert.deepEqual(value, { rules: ['keep', 'old', 'last'], private_note: 'remove' });
  assert.throws(
    () => project({ ...value, rules: ['keep', 'changed', 'last'] }, operations),
    (error) => error.code === 'PROJECTION_GUARD',
  );
});

test('projection refuses array deletion, insertion, unknown actions and duplicate operations', () => {
  const value = { rules: ['first', 'second'] };
  for (const action of ['delete', 'add', 'unknown'])
    assert.throws(
      () =>
        project(value, [
          {
            action,
            pointer: '/rules/0',
            expected_before_sha256: digest('first'),
            expected_absent: true,
            value: 'new',
          },
        ]),
      (error) => error.code === 'PROJECTION_PATH',
    );
  assert.throws(
    () =>
      project(value, [
        {
          action: 'replace',
          pointer: '/rules/2',
          expected_before_sha256: digest('first'),
          value: 'new',
        },
      ]),
    (error) => error.code === 'PROJECTION_PATH',
  );
  const operation = {
    action: 'replace',
    pointer: '/rules/0',
    expected_before_sha256: digest('first'),
    value: 'new',
  };
  assert.throws(
    () => project(value, [operation, operation]),
    (error) => error.code === 'PROJECTION_DUPLICATE',
  );
  assert.throws(
    () => project(value, [{ action: 'add', pointer: '/safe', value: 'new' }]),
    (error) => error.code === 'PROJECTION_GUARD',
  );
  assert.deepEqual(
    project(value, [{ action: 'add', pointer: '/safe', expected_absent: true, value: 'new' }]),
    { ...value, safe: 'new' },
  );
});

test('registered canonical metadata has stable keys and explicit encoding boundaries', () => {
  assert.equal(canonical({ z: [2, 1], a: '文本' }), '{"a":"文本","z":[2,1]}');
  assert.equal(digest({ a: 1, z: 2 }), digest({ z: 2, a: 1 }));
  for (const value of [
    { a: 0.5 },
    { a: Number.MAX_SAFE_INTEGER + 1 },
    { 非ASCII: 1 },
    { a: '\ud800' },
    { a: undefined },
  ])
    assert.throws(() => canonical(value));
});

test('compiled local type closures resolve scalar bindings and reject missing or external types', () => {
  const source = {
    version: '0.6',
    types: {
      Root: {
        type: 'object',
        properties: {
          bound: { $value: '/version' },
          child: { $ref: '#/$defs/Child' },
          token: { $ref: '#/$defs/Token' },
        },
      },
      Child: { type: 'string' },
      Token: { $opaque: true },
      Unused: { type: 'number' },
    },
  };
  const types = compileTypes(source),
    all = closure(types, ['Root']);
  assert.deepEqual(Object.keys(all), ['Child', 'Root', 'Token']);
  assert.deepEqual(all.Root.properties.bound, { const: '0.6', type: 'string' });
  assert.equal(all.Token, false);
  assert.throws(
    () => closure(types, ['Missing']),
    (error) => error.code === 'SOURCE_TYPE',
  );
  assert.throws(
    () => closure({ Root: { $ref: 'https://example.invalid/foreign' } }, ['Root']),
    (error) => error.code === 'SOURCE_REFERENCE',
  );
  assert.throws(
    () => compileTypes({ ...source, version: { object: true } }),
    (error) => error.code === 'SOURCE_VALUE',
  );
});
