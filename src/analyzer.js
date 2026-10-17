/**
 * EvidenceREA Unified Analyzer v2
 * Static analysis of Electron application directories.
 * Produces evidence envelopes. Does not execute target code.
 *
 * Combines patterns from FlowREA (pipeline reconstruction) and
 * JoplinREA (feature-area detection) into one unified walker.
 */

const fs = require('fs');
const path = require('path');
const { version } = require('../package.json');

/**
 * Recursively walk a directory for JS/TS files.
 * Skips node_modules and dot-directories.
 *
 * Directory entries are sorted by name so traversal order — and therefore the
 * emitted module/finding/feature order — never depends on the filesystem's
 * readdir order. Same input, same output.
 */
function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      walk(full, files);
    } else if (entry.isFile() && /\.(js|mjs|cjs|ts|tsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

/**
 * Extract Electron IPC channel names from file content.
 * Detects: ipcMain.handle, ipcMain.on, ipcRenderer.invoke, ipcRenderer.send, ipcRenderer.on
 */
function extractIpcChannels(content) {
  const channels = new Set();
  const patterns = [
    /ipcMain\.handle\(\s*['"`]([^'"`]+)['"`]/g,
    /ipcMain\.on\(\s*['"`]([^'"`]+)['"`]/g,
    /ipcRenderer\.invoke\(\s*['"`]([^'"`]+)['"`]/g,
    /ipcRenderer\.send\(\s*['"`]([^'"`]+)['"`]/g,
    /ipcRenderer\.on\(\s*['"`]([^'"`]+)['"`]/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(content))) channels.add(m[1]);
  }
  return Array.from(channels);
}

/**
 * Detect globalShortcut usage.
 */
function detectGlobalShortcut(content) {
  return /globalShortcut\.register/.test(content);
}

/**
 * Detect contextBridge / preload exposure.
 */
function detectContextBridge(content) {
  return content.includes('contextBridge') || content.includes('exposeInMainWorld');
}

/**
 * Match a feature keyword when it starts a word or a camelCase identifier
 * segment (`onSyncProgress`, `cloudSync`, `renderMarkdown`) without matching
 * incidental substrings (`async`, `denote`).
 */
function keywordHit(content, ...stems) {
  return stems.some(stem => {
    const tail = stem.slice(1);
    return new RegExp(`\\b${stem}`, 'i').test(content)
      || new RegExp(`[a-z0-9]${stem[0].toUpperCase()}${tail}`).test(content);
  });
}

/**
 * Detect feature-area keywords in content.
 */
function detectFeatureAreas(content) {
  const areas = {};
  if (content.length > 200 && keywordHit(content, 'note', 'notebook', 'markdown')) areas.notes = true;
  if (keywordHit(content, 'sync', 'dropbox', 'onedrive', 'webdav')) areas.sync = true;
  if (/encrypt|e2ee|masterKey|cipher/i.test(content)) areas.encryption = true;
  if (/plugin|PluginService|registerPlugin/i.test(content)) areas.plugins = true;
  return areas;
}

/**
 * Analyze an Electron app directory.
 * Returns a unified evidence envelope.
 */
function analyze(appRoot) {
  const files = walk(appRoot);
  const modules = [];
  const allChannels = new Set();
  const findings = [];
  const featureHits = { notes: [], sync: [], encryption: [], plugins: [], electron: [] };

  for (const file of files) {
    let content = '';
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const rel = path.relative(appRoot, file);
    const channels = extractIpcChannels(content);
    channels.forEach(c => allChannels.add(c));

    modules.push({
      path: rel,
      size: Buffer.byteLength(content, 'utf8'),
      hasIpc: channels.length > 0,
      channels,
    });

    // Pipeline: globalShortcut
    if (detectGlobalShortcut(content)) {
      findings.push({
        claim: 'Application registers system-wide hotkeys via Electron globalShortcut',
        evidence: [`${rel} contains globalShortcut.register`],
        confidence: 'high',
        limitations: ['Exact key combination and native accessibility bridge not verified by static analysis alone'],
      });
    }

    // Pipeline: injection-related IPC
    if (channels.some(c => /inject|clipboard|accessibility|paste/i.test(c))) {
      findings.push({
        claim: 'IPC channel related to text injection or clipboard is present',
        evidence: channels.filter(c => /inject|clipboard|accessibility|paste/i.test(c)).map(c => `${rel}: ${c}`),
        confidence: 'high',
        limitations: ['Native implementation of injection (if any) is outside the JS layer'],
      });
    }

    // Pipeline: dictation-related IPC
    if (channels.some(c => /dictation|record|transcri/i.test(c))) {
      findings.push({
        claim: 'IPC channels for dictation start/stop are present',
        evidence: channels.filter(c => /dictation|record|transcri/i.test(c)).map(c => `${rel}: ${c}`),
        confidence: 'high',
        limitations: ['Audio capture implementation details not visible in static analysis'],
      });
    }

    // Feature areas: contextBridge
    if (detectContextBridge(content)) {
      findings.push({
        claim: 'contextBridge / preload exposure present',
        evidence: [rel],
        confidence: 'high',
        limitations: [],
      });
      featureHits.electron.push(rel);
    }

    // Feature areas: keyword detection
    const areas = detectFeatureAreas(content);
    if (areas.notes) featureHits.notes.push(rel);
    if (areas.sync) featureHits.sync.push(rel);
    if (areas.encryption) featureHits.encryption.push(rel);
    if (areas.plugins) featureHits.plugins.push(rel);
  }

  // Feature-area findings
  if (featureHits.notes.length) {
    findings.push({
      claim: 'Notes / Markdown handling modules present',
      evidence: featureHits.notes.slice(0, 5),
      confidence: 'high',
      limitations: ['Full data model may live in shared packages outside the scanned path'],
    });
  }
  if (featureHits.sync.length) {
    findings.push({
      claim: 'Sync-related modules present',
      evidence: featureHits.sync.slice(0, 5),
      confidence: 'high',
      limitations: [],
    });
  }
  if (featureHits.encryption.length) {
    findings.push({
      claim: 'Encryption / E2EE related code present',
      evidence: featureHits.encryption.slice(0, 5),
      confidence: 'medium',
      limitations: ['Core crypto may live in shared libraries outside the scanned path'],
    });
  }
  if (featureHits.plugins.length) {
    findings.push({
      claim: 'Plugin system touchpoints present',
      evidence: featureHits.plugins.slice(0, 5),
      confidence: 'high',
      limitations: [],
    });
  }

  const envelope = {
    version,
    provider: 'evidencerea-static',
    target: appRoot,
    filesScanned: files.length,
    modules,
    ipcChannels: Array.from(allChannels).sort(),
    findings,
    featureHits: {
      notes: featureHits.notes.length,
      sync: featureHits.sync.length,
      encryption: featureHits.encryption.length,
      plugins: featureHits.plugins.length,
      electron: featureHits.electron.length,
    },
    limitations: [
      'Static analysis of source files only',
      'Native .node add-ons and external helpers are not decompiled',
      'Does not execute the application',
      'Dynamically constructed channel names may be missed by regex analysis',
    ],
  };

  return envelope;
}

module.exports = {
  analyze,
  walk,
  extractIpcChannels,
  detectGlobalShortcut,
  detectContextBridge,
  detectFeatureAreas,
};
