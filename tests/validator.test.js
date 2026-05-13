const { describe, it } = require('node:test');
const assert = require('node:assert');
const { execSync } = require('child_process');
const path = require('path');

const LINT = path.join(__dirname, '..', 'validators', 'kdna-lint.js');
const VALIDATE = path.join(__dirname, '..', 'validators', 'kdna-validate.js');

describe('Validator (kdna-lint)', () => {
  it('passes communication domain', () => {
    const result = execSync(`node "${LINT}" examples/communication`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
    });
    assert.ok(result.includes('valid'));
  });

  it('passes code_review domain', () => {
    const result = execSync(`node "${LINT}" examples/from-wiki-to-kdna/kdna`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
    });
    assert.ok(result.includes('valid'));
  });

  it('passes Chinese product_decision domain', () => {
    const result = execSync(`node "${LINT}" examples/product_decision`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
    });
    assert.ok(result.includes('valid'));
  });

  it('fails on nonexistent directory', () => {
    try {
      execSync(`node "${LINT}" nonexistent_dir`, {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8',
      });
      assert.fail('Should have thrown');
    } catch (e) {
      assert.ok(e.status !== 0);
    }
  });

  it('prints usage when no argument', () => {
    try {
      execSync(`node "${LINT}"`, {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8',
      });
      assert.fail('Should have thrown');
    } catch (e) {
      assert.ok(e.stderr.includes('Usage') || e.status === 2);
    }
  });
});

describe('Validator (kdna-validate)', () => {
  it('passes communication domain', () => {
    const result = execSync(`node "${VALIDATE}" examples/communication`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
    });
    assert.ok(result.includes('valid'));
  });

  it('passes code_review domain', () => {
    const result = execSync(`node "${VALIDATE}" examples/from-wiki-to-kdna/kdna`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
    });
    assert.ok(result.includes('valid'));
  });

  it('passes Chinese product_decision domain', () => {
    const result = execSync(`node "${VALIDATE}" examples/product_decision`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
    });
    assert.ok(result.includes('valid'));
  });
});
