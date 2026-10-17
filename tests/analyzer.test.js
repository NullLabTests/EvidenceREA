const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { analyze, extractIpcChannels, detectGlobalShortcut, detectContextBridge, detectFeatureAreas } = require('../src/analyzer');

const FIXTURE = path.join(__dirname, '../fixtures/wispr-like/resources/app');

describe('EvidenceREA Analyzer', () => {
  describe('walk and file discovery', () => {
    it('finds all JS files in the fixture', () => {
      const envelope = analyze(FIXTURE);
      assert.ok(envelope.filesScanned >= 3, `expected at least 3 files, got ${envelope.filesScanned}`);
      assert.ok(envelope.modules.length >= 3, `expected at least 3 modules, got ${envelope.modules.length}`);
      assert.ok(envelope.modules.every(m => typeof m.path === 'string' && typeof m.size === 'number'),
        'each module entry should carry a relative path and size');
    });

    it('reports module sizes in bytes, not UTF-16 code units', () => {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'evrea-size-'));
      const file = path.join(tmp, 'unicode.js');
      fs.writeFileSync(file, 'const s = "你好 héllo";\n');

      const envelope = analyze(tmp);
      const mod = envelope.modules.find(m => m.path === 'unicode.js');
      assert.ok(mod, 'should include the scanned file');
      assert.strictEqual(mod.size, fs.statSync(file).size, 'size should be the on-disk byte length');

      fs.rmSync(tmp, { recursive: true, force: true });
    });

    it('skips node_modules and dot-directories', () => {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'evrea-test-'));
      fs.mkdirSync(path.join(tmp, 'node_modules', 'dep'), { recursive: true });
      fs.mkdirSync(path.join(tmp, '.git'), { recursive: true });
      fs.mkdirSync(path.join(tmp, 'src'), { recursive: true });
      fs.writeFileSync(path.join(tmp, 'node_modules', 'dep', 'index.js'), 'ipcMain.handle("x", () => {})');
      fs.writeFileSync(path.join(tmp, '.git', 'config'), 'ipcMain.handle("y", () => {})');
      fs.writeFileSync(path.join(tmp, 'src', 'main.js'), 'ipcMain.handle("z", () => {})');

      const envelope = analyze(tmp);
      assert.strictEqual(envelope.filesScanned, 1, 'should only find src/main.js');
      assert.strictEqual(envelope.ipcChannels.length, 1);
      assert.strictEqual(envelope.ipcChannels[0], 'z');

      fs.rmSync(tmp, { recursive: true, force: true });
    });
  });

  describe('IPC channel extraction', () => {
    it('extracts dictation:start, dictation:stop, inject:text from fixture', () => {
      const envelope = analyze(FIXTURE);
      assert.ok(envelope.ipcChannels.includes('dictation:start'), 'should find dictation:start');
      assert.ok(envelope.ipcChannels.includes('dictation:stop'), 'should find dictation:stop');
      assert.ok(envelope.ipcChannels.includes('inject:text'), 'should find inject:text');
    });

    it('extracts channels from all IPC patterns', () => {
      const content = `
        ipcMain.handle('a:1', () => {});
        ipcMain.on('b:2', () => {});
        ipcRenderer.invoke('c:3', () => {});
        ipcRenderer.send('d:4', () => {});
        ipcRenderer.on('e:5', () => {});
      `;
      const channels = extractIpcChannels(content);
      assert.deepStrictEqual(channels.sort(), ['a:1', 'b:2', 'c:3', 'd:4', 'e:5']);
    });

    it('returns empty array when no IPC patterns found', () => {
      const channels = extractIpcChannels('const x = 1;');
      assert.deepStrictEqual(channels, []);
    });
  });

  describe('globalShortcut detection', () => {
    it('detects globalShortcut.register in fixture', () => {
      const mainFile = path.join(FIXTURE, 'main/index.js');
      const content = fs.readFileSync(mainFile, 'utf8');
      assert.ok(detectGlobalShortcut(content), 'should detect globalShortcut');
    });

    it('returns false when no globalShortcut present', () => {
      assert.strictEqual(detectGlobalShortcut('const x = 1;'), false);
    });
  });

  describe('contextBridge detection', () => {
    it('detects contextBridge in preload', () => {
      const preloadFile = path.join(FIXTURE, 'preload/index.js');
      const content = fs.readFileSync(preloadFile, 'utf8');
      assert.ok(detectContextBridge(content), 'should detect contextBridge');
    });
  });

  describe('evidence envelopes', () => {
    it('every finding has claim, evidence, confidence, limitations', () => {
      const envelope = analyze(FIXTURE);
      assert.ok(envelope.findings.length > 0, 'should have findings');
      for (const f of envelope.findings) {
        assert.ok(f.claim, 'claim required');
        assert.ok(Array.isArray(f.evidence), 'evidence must be array');
        assert.ok(['high', 'medium', 'low'].includes(f.confidence), `invalid confidence: ${f.confidence}`);
        assert.ok(Array.isArray(f.limitations), 'limitations must be array');
      }
    });

    it('finds hotkey-related finding', () => {
      const envelope = analyze(FIXTURE);
      assert.ok(
        envelope.findings.some(f => /hotkey|globalShortcut/i.test(f.claim)),
        'should find hotkey finding'
      );
    });

    it('finds injection-related finding', () => {
      const envelope = analyze(FIXTURE);
      assert.ok(
        envelope.findings.some(f => /inject|clipboard/i.test(f.claim)),
        'should find injection finding'
      );
    });
  });

  describe('feature hits', () => {
    it('reports feature hit counts', () => {
      const envelope = analyze(FIXTURE);
      assert.ok(envelope.featureHits.electron > 0, 'should detect electron IPC hits');
    });
  });

  describe('feature keyword detection', () => {
    const long = (s) => s + '\n' + '// filler line\n'.repeat(30);

    it('matches camelCase sync identifiers but not the async keyword', () => {
      assert.strictEqual(detectFeatureAreas('onSyncProgress(cb)').sync, true);
      assert.strictEqual(detectFeatureAreas('this.cloudSync = true').sync, true);
      assert.strictEqual(detectFeatureAreas('const m = dataSyncManager').sync, true);
      assert.strictEqual(detectFeatureAreas('async function run() {}').sync, undefined);
    });

    it('matches notes identifiers without matching the word denote', () => {
      assert.strictEqual(detectFeatureAreas(long('renderMarkdown()')).notes, true);
      assert.strictEqual(detectFeatureAreas(long('onNoteCreated()')).notes, true);
      assert.strictEqual(detectFeatureAreas(long('this will denote nothing')).notes, undefined);
    });
  });

  describe('envelope structure', () => {
    it('has provider, target, filesScanned, ipcChannels, findings, limitations', () => {
      const envelope = analyze(FIXTURE);
      assert.strictEqual(envelope.provider, 'evidencerea-static');
      assert.strictEqual(envelope.target, FIXTURE);
      assert.ok(typeof envelope.filesScanned === 'number');
      assert.ok(Array.isArray(envelope.ipcChannels));
      assert.ok(Array.isArray(envelope.findings));
      assert.ok(Array.isArray(envelope.limitations));
      assert.ok(envelope.limitations.length > 0, 'should have global limitations');
    });

    it('produces identical output for the same input', () => {
      assert.deepStrictEqual(analyze(FIXTURE), analyze(FIXTURE));
    });
  });
});
