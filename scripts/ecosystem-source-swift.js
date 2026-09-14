'use strict';

const assert = require('node:assert/strict');

// This is a deliberately restricted source-inventory grammar, not a Swift evaluator.
// Comments may separate tokens; dependency values must remain literal URL/revision pairs.
function tokens(text) {
  const result = [];
  for (let index = 0; index < text.length;) {
    if (/\s/u.test(text[index])) {
      index++;
      continue;
    }
    if (text.startsWith('//', index)) {
      const end = text.indexOf('\n', index);
      index = end < 0 ? text.length : end + 1;
      continue;
    }
    if (text.startsWith('/*', index)) {
      let depth = 1;
      index += 2;
      while (index < text.length && depth) {
        if (text.startsWith('/*', index)) {
          depth++;
          index += 2;
        } else if (text.startsWith('*/', index)) {
          depth--;
          index += 2;
        } else index++;
      }
      assert.equal(depth, 0, 'unterminated Swift comment');
      continue;
    }
    assert.ok(
      !text.startsWith('#"', index) && !text.startsWith('"""', index),
      'source Swift inventory does not accept raw or multiline strings',
    );
    if (text[index] === '"') {
      const start = ++index;
      while (index < text.length && text[index] !== '"') {
        assert.ok(
          !'\\\n\r'.includes(text[index]),
          'source Swift inventory requires unescaped literal strings',
        );
        index++;
      }
      assert.ok(index < text.length, 'unterminated Swift string');
      result.push({ string: text.slice(start, index++) });
      continue;
    }
    if (text[index] === '`') {
      const end = text.indexOf('`', index + 1);
      assert.ok(end > index + 1, 'unterminated Swift identifier');
      const name = text.slice(index + 1, end);
      assert.match(name, /^[A-Za-z_][A-Za-z_0-9]*$/u);
      result.push(name);
      index = end + 1;
      continue;
    }
    const identifier = /^[A-Za-z_][A-Za-z_0-9]*/u.exec(text.slice(index));
    if (identifier) {
      result.push(identifier[0]);
      index += identifier[0].length;
    } else result.push(text[index++]);
  }
  return result;
}

function splitArguments(input) {
  const pairs = { '(': ')', '[': ']', '{': '}' };
  const stack = [];
  const rows = [];
  let start = 0;
  for (let index = 0; index < input.length; index++) {
    const token = input[index];
    if (pairs[token]) stack.push(pairs[token]);
    else if ([')', ']', '}'].includes(token))
      assert.equal(stack.pop(), token, 'unbalanced Swift declaration');
    else if (token === ',' && !stack.length) {
      rows.push(input.slice(start, index));
      start = index + 1;
    }
  }
  assert.equal(stack.length, 0, 'unbalanced Swift declaration');
  if (start < input.length) rows.push(input.slice(start));
  return rows;
}

function callEnd(input, start) {
  assert.equal(input[start], '(');
  let depth = 0;
  for (let index = start; index < input.length; index++) {
    if (input[index] === '(') depth++;
    if (input[index] === ')' && --depth === 0) return index;
  }
  assert.fail('unterminated Swift package call');
}

function dependency(input) {
  assert.equal(input[0], '.');
  assert.equal(input[1], 'package');
  assert.equal(input[2], '(');
  assert.equal(
    callEnd(input, 2),
    input.length - 1,
    'source Swift dependency must be a literal package call',
  );
  const args = splitArguments(input.slice(3, -1));
  assert.ok(
    !args.some((arg) => arg[0] === 'path'),
    'source Swift dependency must not require a sibling path',
  );
  assert.equal(args.length, 2, 'every Swift dependency requires an explicit URL and full revision');
  const values = {};
  for (const arg of args) {
    assert.ok(
      arg.length === 3 &&
        arg[1] === ':' &&
        typeof arg[2]?.string === 'string' &&
        ['url', 'revision'].includes(arg[0]) &&
        !Object.hasOwn(values, arg[0]),
      'every Swift dependency requires an explicit URL and full revision',
    );
    values[arg[0]] = arg[2].string;
  }
  assert.match(
    values.url || '',
    /^https:\/\/github\.com\/aikdna\/[a-z0-9-]+\.git$/u,
    'Swift source dependency requires an explicit public Git URL',
  );
  assert.match(
    values.revision || '',
    /^[a-f0-9]{40}$/u,
    'every Swift dependency requires an explicit URL and full revision',
  );
  return values;
}

function swiftDependencies(text) {
  const input = tokens(text);
  const calls = [];
  for (let index = 0; index < input.length - 1; index++)
    if (input[index] === '.' && input[index + 1] === 'package') {
      assert.equal(
        input[index + 2],
        '(',
        'source Swift package factory reference is not a literal dependency',
      );
      const end = callEnd(input, index + 2);
      calls.push(dependency(input.slice(index, end + 1)));
    }
  const constructors = [];
  for (let index = 0; index < input.length - 1; index++)
    if (input[index] === 'Package' && input[index + 1] === '(') {
      constructors.push(splitArguments(input.slice(index + 2, callEnd(input, index + 1))));
    }
  assert.equal(
    constructors.length,
    1,
    'source Swift inventory requires one literal Package declaration',
  );
  const declarations = constructors[0].filter((arg) => arg[0] === 'dependencies' && arg[1] === ':');
  assert.equal(
    declarations.length,
    1,
    'source Swift inventory requires an explicit dependency array',
  );
  const array = declarations[0].slice(2);
  assert.ok(
    array[0] === '[' && array.at(-1) === ']',
    'source Swift dependencies must be a literal array',
  );
  const actual = splitArguments(array.slice(1, -1)).map(dependency);
  assert.deepEqual(
    calls,
    actual,
    'source Swift package calls outside the literal dependency array are unsupported',
  );
  return actual;
}

module.exports = { swiftDependencies };
