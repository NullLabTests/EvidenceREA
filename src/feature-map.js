/**
 * EvidenceREA Feature Map Generator
 * Turns analyzer output into structured feature maps.
 * Supports two modes: pipeline reconstruction and feature-area detection.
 */

/**
 * Build a pipeline reconstruction feature map (FlowREA-style).
 * Reconstructs the hotkey → dictation → injection path.
 */
function buildPipelineMap(envelope) {
  const channels = envelope.ipcChannels || [];
  const hasInject = channels.some(c => /inject|clipboard|accessibility/i.test(c));
  const hasDictation = channels.some(c => /dictation|record|transcri/i.test(c));
  const hasHotkey = envelope.findings.some(f => /hotkey|globalShortcut/i.test(f.claim));

  const map = {
    title: 'Pipeline Reconstruction (evidence-backed)',
    target: envelope.target,
    mode: 'pipeline',
    steps: [],
    unknowns: [
      'Exact native text-injection mechanism (accessibility API, clipboard simulation, or helper binary)',
      'Whether transcription is performed locally or via remote endpoint',
      'Audio capture implementation details (getUserMedia vs native module)',
    ],
  };

  map.steps.push({
    step: 'Hotkey / Trigger',
    claim: hasHotkey
      ? 'System-wide hotkey is registered in the main process'
      : 'No globalShortcut usage detected',
    evidence: envelope.findings
      .filter(f => /hotkey|globalShortcut/i.test(f.claim))
      .map(f => f.evidence)
      .flat(),
    confidence: hasHotkey ? 'high' : 'low',
  });

  map.steps.push({
    step: 'Audio Capture / Dictation Start-Stop',
    claim: hasDictation
      ? 'IPC channels exist for starting and stopping dictation'
      : 'No explicit dictation IPC channels found in static analysis',
    evidence: channels.filter(c => /dictation|record|transcri/i.test(c)),
    confidence: hasDictation ? 'high' : 'low',
  });

  map.steps.push({
    step: 'Transcription',
    claim: 'Transcription backend is not fully visible in static JS analysis',
    evidence: [],
    confidence: 'low',
    note: 'May be local model or remote API; requires runtime or network capture for confirmation',
  });

  map.steps.push({
    step: 'Text Injection',
    claim: hasInject
      ? 'IPC channel(s) for injecting text into the focused application are present'
      : 'No injection-related IPC channel found',
    evidence: channels.filter(c => /inject|clipboard|accessibility|paste/i.test(c)),
    confidence: hasInject ? 'high' : 'low',
  });

  return map;
}

/**
 * Build a feature-area detection map (JoplinREA-style).
 * Detects broad feature areas across the source tree.
 */
function buildFeatureAreaMap(envelope) {
  const hits = envelope.featureHits || {};
  const findings = envelope.findings || [];

  const map = {
    title: 'Feature-Area Detection (evidence-backed)',
    target: envelope.target,
    mode: 'features',
    areas: [],
    unknowns: [],
  };

  const areaDefs = [
    { key: 'notes', label: 'Notes / Markdown', claim: 'Notes / Markdown handling modules present' },
    { key: 'sync', label: 'Sync / Cloud', claim: 'Sync-related modules present' },
    { key: 'encryption', label: 'Encryption / E2EE', claim: 'Encryption / E2EE related code present' },
    { key: 'plugins', label: 'Plugin System', claim: 'Plugin system touchpoints present' },
    { key: 'electron', label: 'Electron IPC', claim: 'Electron IPC / contextBridge usage detected' },
  ];

  for (const area of areaDefs) {
    const count = hits[area.key] || 0;
    const areaFindings = findings.filter(f => f.claim === area.claim);
    map.areas.push({
      area: area.label,
      claim: count > 0 ? area.claim : `No ${area.label.toLowerCase()} modules detected`,
      evidence: areaFindings.length > 0 ? areaFindings[0].evidence : [],
      confidence: count > 0 ? 'high' : 'low',
      fileCount: count,
    });
  }

  map.unknowns.push(
    'Full data models may live in shared packages outside the scanned path',
    'Runtime behavior and native modules require additional tools',
  );

  return map;
}

/**
 * Build both maps and return them together.
 */
function buildAllMaps(envelope) {
  return {
    pipeline: buildPipelineMap(envelope),
    features: buildFeatureAreaMap(envelope),
  };
}

/**
 * Convert a feature map to Markdown.
 */
function toMarkdown(map) {
  let md = `# ${map.title}\n\n`;
  md += `Target: \`${map.target}\`\n\n`;

  if (map.mode === 'pipeline') {
    md += `## Pipeline\n\n`;
    for (const step of map.steps) {
      md += `### ${step.step}\n`;
      md += `- **Claim**: ${step.claim}\n`;
      md += `- **Confidence**: ${step.confidence}\n`;
      if (step.evidence && step.evidence.length) {
        md += `- **Evidence**:\n`;
        step.evidence.forEach(e => { md += `  - ${e}\n`; });
      }
      if (step.note) md += `- **Note**: ${step.note}\n`;
      md += `\n`;
    }
    md += `## Unknowns\n\n`;
    map.unknowns.forEach(u => { md += `- ${u}\n`; });
  } else {
    md += `## Feature Areas\n\n`;
    for (const area of map.areas) {
      md += `### ${area.area}\n`;
      md += `- **Claim**: ${area.claim}\n`;
      md += `- **Confidence**: ${area.confidence}\n`;
      md += `- **Files**: ${area.fileCount}\n`;
      if (area.evidence && area.evidence.length) {
        md += `- **Evidence**:\n`;
        area.evidence.forEach(e => { md += `  - ${e}\n`; });
      }
      md += `\n`;
    }
    md += `## Unknowns\n\n`;
    map.unknowns.forEach(u => { md += `- ${u}\n`; });
  }

  md += `\n---\nGenerated by EvidenceREA. For lawful analysis of software you own or are authorized to examine only.\n`;
  return md;
}

module.exports = {
  buildPipelineMap,
  buildFeatureAreaMap,
  buildAllMaps,
  toMarkdown,
};
