const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { analyze } = require('../src/analyzer');
const { buildPipelineMap, buildFeatureAreaMap, buildAllMaps, toMarkdown } = require('../src/feature-map');

const FIXTURE = path.join(__dirname, '../fixtures/wispr-like/resources/app');

describe('EvidenceREA Feature Map', () => {
  describe('pipeline reconstruction', () => {
    it('produces a pipeline map with hotkey, capture, inject steps', () => {
      const envelope = analyze(FIXTURE);
      const map = buildPipelineMap(envelope);
      assert.strictEqual(map.mode, 'pipeline');
      assert.strictEqual(map.steps.length, 4);

      const hotkeyStep = map.steps.find(s => s.step === 'Hotkey / Trigger');
      assert.ok(hotkeyStep, 'should have hotkey step');
      assert.strictEqual(hotkeyStep.confidence, 'high');

      const captureStep = map.steps.find(s => s.step === 'Audio Capture / Dictation Start-Stop');
      assert.ok(captureStep, 'should have capture step');
      assert.strictEqual(captureStep.confidence, 'high');

      const injectStep = map.steps.find(s => s.step === 'Text Injection');
      assert.ok(injectStep, 'should have inject step');
      assert.strictEqual(injectStep.confidence, 'high');
      assert.ok(injectStep.evidence.includes('inject:text'));
    });

    it('marks transcription as low confidence', () => {
      const envelope = analyze(FIXTURE);
      const map = buildPipelineMap(envelope);
      const transcriptionStep = map.steps.find(s => s.step === 'Transcription');
      assert.ok(transcriptionStep, 'should have transcription step');
      assert.strictEqual(transcriptionStep.confidence, 'low');
      assert.ok(transcriptionStep.note, 'should have a note about transcription');
    });

    it('lists unknowns', () => {
      const envelope = analyze(FIXTURE);
      const map = buildPipelineMap(envelope);
      assert.ok(map.unknowns.length > 0, 'should list unknowns');
      assert.ok(map.unknowns.some(u => /native/i.test(u)), 'should mention native injection');
      assert.ok(map.unknowns.some(u => /transcription/i.test(u)), 'should mention transcription backend');
    });
  });

  describe('feature-area detection', () => {
    it('produces a feature-area map with all areas', () => {
      const envelope = analyze(FIXTURE);
      const map = buildFeatureAreaMap(envelope);
      assert.strictEqual(map.mode, 'features');
      assert.strictEqual(map.areas.length, 5);

      const areaNames = map.areas.map(a => a.area);
      assert.ok(areaNames.includes('Notes / Markdown'));
      assert.ok(areaNames.includes('Sync / Cloud'));
      assert.ok(areaNames.includes('Encryption / E2EE'));
      assert.ok(areaNames.includes('Plugin System'));
      assert.ok(areaNames.includes('Electron IPC'));
    });

    it('detects electron IPC area in fixture', () => {
      const envelope = analyze(FIXTURE);
      const map = buildFeatureAreaMap(envelope);
      const electronArea = map.areas.find(a => a.area === 'Electron IPC');
      assert.ok(electronArea.fileCount > 0, 'should detect electron IPC files');
      assert.strictEqual(electronArea.confidence, 'high');
    });
  });

  describe('buildAllMaps', () => {
    it('returns both pipeline and features maps', () => {
      const envelope = analyze(FIXTURE);
      const maps = buildAllMaps(envelope);
      assert.ok(maps.pipeline, 'should have pipeline map');
      assert.ok(maps.features, 'should have features map');
      assert.strictEqual(maps.pipeline.mode, 'pipeline');
      assert.strictEqual(maps.features.mode, 'features');
    });
  });

  describe('markdown output', () => {
    it('pipeline map produces valid markdown', () => {
      const envelope = analyze(FIXTURE);
      const map = buildPipelineMap(envelope);
      const md = toMarkdown(map);
      assert.ok(md.includes('# Pipeline Reconstruction'), 'should have title');
      assert.ok(md.includes('Hotkey / Trigger'), 'should have hotkey step');
      assert.ok(md.includes('Text Injection'), 'should have inject step');
      assert.ok(md.includes('## Unknowns'), 'should have unknowns section');
      assert.ok(md.includes('EvidenceREA'), 'should have footer');
    });

    it('feature-area map produces valid markdown', () => {
      const envelope = analyze(FIXTURE);
      const map = buildFeatureAreaMap(envelope);
      const md = toMarkdown(map);
      assert.ok(md.includes('# Feature-Area Detection'), 'should have title');
      assert.ok(md.includes('## Feature Areas'), 'should have areas section');
      assert.ok(md.includes('EvidenceREA'), 'should have footer');
    });
  });
});
