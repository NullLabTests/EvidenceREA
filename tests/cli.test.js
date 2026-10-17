const { describe, it } = require('node:test');
const assert = require('node:assert');
const { execFileSync } = require('child_process');
const path = require('path');

const CLI = path.join(__dirname, '../src/cli.js');
const FIXTURE = path.join(__dirname, '../fixtures/wispr-like');

function runCli(args) {
  return execFileSync('node', [CLI, ...args], { encoding: 'utf8', timeout: 10000 });
}

describe('EvidenceREA CLI', () => {
  it('exits 0 and produces JSON on fixture with --format json', () => {
    const stdout = runCli([FIXTURE, '--mode', 'pipeline', '--format', 'json']);
    const output = JSON.parse(stdout);
    assert.ok(output.envelope, 'should have envelope');
    assert.ok(output.featureMap, 'should have featureMap');
    assert.strictEqual(output.featureMap.mode, 'pipeline');
    assert.ok(output.envelope.findings.length > 0, 'should have findings');
  });

  it('produces valid markdown with --format markdown', () => {
    const stdout = runCli([FIXTURE, '--mode', 'pipeline', '--format', 'markdown']);
    assert.ok(stdout.includes('# Pipeline Reconstruction'), 'should have markdown title');
    assert.ok(stdout.includes('Hotkey / Trigger'), 'should have pipeline steps');
  });

  it('auto mode returns both maps', () => {
    const stdout = runCli([FIXTURE, '--mode', 'auto', '--format', 'json']);
    const output = JSON.parse(stdout);
    assert.ok(output.pipeline, 'should have pipeline map');
    assert.ok(output.features, 'should have features map');
  });

  it('features mode returns feature-area map', () => {
    const stdout = runCli([FIXTURE, '--mode', 'features', '--format', 'json']);
    const output = JSON.parse(stdout);
    assert.strictEqual(output.featureMap.mode, 'features');
    assert.ok(output.featureMap.areas.length > 0, 'should have areas');
  });

  it('errors on missing path', () => {
    assert.throws(() => runCli([]), /No target path provided/);
  });

  it('errors on nonexistent path', () => {
    assert.throws(() => runCli(['/nonexistent/path']), /does not exist/);
  });

  it('--help prints usage', () => {
    const stdout = runCli(['--help']);
    assert.ok(stdout.includes('EvidenceREA'), 'should mention tool name');
    assert.ok(stdout.includes('--mode'), 'should mention --mode');
    assert.ok(stdout.includes('--format'), 'should mention --format');
  });
});
