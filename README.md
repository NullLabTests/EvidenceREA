# EvidenceREA

**Unified evidence-backed static analyzer for Electron applications.**

EvidenceREA combines the best ideas from two prior projects — FlowREA (synthetic fixture analysis) and JoplinREA (real open-source target analysis) — into one polished, tested, reusable tool.

## What It Does

EvidenceREA scans Electron application source trees and produces:

- **Evidence envelopes** — every finding has a `claim`, `evidence`, `confidence` level, and explicit `limitations`
- **Pipeline reconstruction** — step-by-step feature path maps (e.g., hotkey → dictation → injection)
- **Feature-area detection** — broad area detection (notes, sync, plugins, encryption, IPC)

All output is deterministic, local, and useful as input to a coding agent.

## Quick Start

```bash
# Clone and enter
git clone https://github.com/nulllabtests/EvidenceREA.git
cd EvidenceREA

# Run tests
npm test

# Analyze the synthetic fixture (pipeline mode)
node src/cli.js fixtures/wispr-like --mode pipeline

# Analyze a real Electron app (feature-area mode)
node src/cli.js /path/to/electron/app --mode features

# Both modes, JSON output
node src/cli.js fixtures/wispr-like --mode auto --format json
```

## Two Analysis Modes

### 1. Pipeline Reconstruction (FlowREA-style)

Reconstructs a specific user-visible feature path. Ships with a synthetic "wispr-like" fixture that exercises the voice-dictation pipeline:

- **Hotkey** → `globalShortcut.register('CommandOrControl+Shift+Space', ...)`
- **Capture** → `ipcMain.handle('dictation:start', ...)` / `dictation:stop`
- **Transcription** → *(unknown — explicitly marked)*
- **Injection** → `ipcMain.handle('inject:text', ...)`

### 2. Feature-Area Detection (JoplinREA-style)

Detects broad feature areas across a real source tree:

- Notes / Markdown handling
- Sync / cloud synchronization
- Encryption / E2EE
- Plugin system
- Electron IPC / contextBridge usage

Point it at any open-source Electron app (e.g., a Joplin clone) to get instant feature-area findings.

## What You Gain from Evidence-Backed Analysis

| Benefit | How |
|---|---|
| **Reproducibility** | Same input → same output. Deterministic, versioned, git-tracked. |
| **Agent hand-off** | JSON + Markdown output is directly consumable by coding agents. |
| **Clean-room work** | Evidence envelopes describe *what* exists without copying proprietary source. |
| **Onboarding** | New team members can understand an unfamiliar Electron app's architecture in minutes. |
| **Security review** | IPC channels, contextBridge exposures, and preload boundaries are enumerated with file citations. |

## Repository Layout

```
EvidenceREA/
├── src/
│   ├── analyzer.js       # Core walker, IPC extraction, evidence envelopes
│   ├── feature-map.js    # Dual-mode feature map generator
│   └── cli.js            # CLI entry point
├── fixtures/
│   └── wispr-like/       # Synthetic Electron app fixture
├── tests/
│   ├── analyzer.test.js  # Analyzer unit tests
│   ├── feature-map.test.js # Feature map tests
│   └── cli.test.js       # CLI integration tests
├── intent.md             # SDLC: problem & desired outcome
├── spec.md               # SDLC: functional requirements
├── plan.md               # SDLC: implementation plan
├── CLAUDE.md             # Agent instructions
├── LICENSE               # MIT
├── CONTRIBUTING.md       # Contribution guidelines
└── SECURITY.md           # Lawful use policy
```

## Using on a New Target

1. **Open-source app**: Clone the repo, then run:
   ```bash
   node src/cli.js /path/to/cloned/app --mode auto
   ```

2. **Your own app**: Point it at your `app/` or `packages/app-desktop/` directory.

3. **Extracted binary**: If you have an extracted Electron app directory (e.g., from an ASAR), point it at the `resources/app/` folder.

4. **Output as agent input**: Pipe the JSON to a coding agent:
   ```bash
   node src/cli.js /path/to/app --format json > evidence.json
   ```

## Extending EvidenceREA

### Adding a New IPC Pattern

Edit `src/analyzer.js` → `extractIpcChannels()`:

```js
const patterns = [
  // ... existing patterns
  /ipcMain\.removeHandler\(\s*['"`]([^'"`]+)['"`]/g,
];
```

### Adding a New Feature Area

Edit `src/analyzer.js` → `detectFeatureAreas()`:

```js
if (/your|keyword|here/i.test(content)) areas.yourArea = true;
```

Then add the corresponding finding and feature-map entry.

### Future Extensions

- ASAR archive parsing (currently requires extracted directories)
- Native analysis hand-off (Ghidra/Hopper integration)
- MCP skill wrapping the CLI for agent-native consumption
- TypeScript AST analysis (replace regex with tree-sitter)

## AI-Native SDLC

This repo follows the [AI-Native SDLC playbook](https://claude.com/blog/the-ai-native-sdlc-playbook):

1. **Plan** → `intent.md` (problem, desired outcome, users, constraints)
2. **Design** → `spec.md` (functional requirements)
3. **Build** → `plan.md` (implementation order)
4. **Test** → `tests/` (comprehensive, passing)
5. **Review** → evidence envelopes with confidence levels
6. **Maintain** → versioned artifacts, git history

## License

MIT. See [LICENSE](LICENSE).

## Lawful Use

**For lawful analysis of software you own or are authorized to examine only.** See [SECURITY.md](SECURITY.md).
