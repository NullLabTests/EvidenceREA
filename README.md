# EvidenceREA

**Unified evidence-backed static analyzer for Electron applications.**

EvidenceREA combines the strongest ideas from two prior projects — **FlowREA** (synthetic-fixture pipeline reconstruction) and **JoplinREA** (real source-tree feature-area detection) — into one polished, tested, reusable tool.

## Why This Exists

Electron applications are everywhere — note-taking, voice dictation, chat, IDEs — but their internal architecture (IPC boundaries, main/renderer split, preload bridges, feature modules) is often opaque. Understanding that architecture matters for:

- **Security researchers** mapping attack surfaces and IPC trust boundaries
- **Contributors and plugin authors** onboarding to an unfamiliar codebase
- **Clean-room reimplementation** teams building interoperable alternatives
- **AI agents** that need structured, auditable analysis to act on

Manual reading is slow. Guessing is unreliable. EvidenceREA gives you a reproducible, structured, evidence-backed map of an Electron app's architecture — with every claim grounded in concrete file citations and every unknown explicitly marked.

## What It Does

EvidenceREA scans an Electron application's source tree and produces:

| Output | Description |
|---|---|
| **Evidence envelopes** | Every finding has `claim`, `evidence`, `confidence`, and `limitations` |
| **Pipeline reconstruction** | Step-by-step feature path maps (e.g., hotkey → dictation → injection) |
| **Feature-area detection** | Broad area detection (notes, sync, plugins, encryption, IPC) |
| **Module graph** | Structured inventory of all JS/TS files with IPC channel tags |
| **Markdown + JSON** | Human-readable reports and machine-parseable envelopes |

All output is deterministic, local, and useful as input to a coding agent.

## Two Analysis Modes

### 1. Pipeline Reconstruction (FlowREA-style)

Reconstructs a specific user-visible feature path. Ships with a synthetic "wispr-like" fixture that exercises the voice-dictation pipeline:

```
Hotkey → Capture → Transcription (unknown) → Injection
```

- **Hotkey**: `globalShortcut.register('CommandOrControl+Shift+Space', ...)`
- **Capture**: `ipcMain.handle('dictation:start', ...)` / `dictation:stop`
- **Transcription**: *unknown — explicitly marked as requiring runtime/network analysis*
- **Injection**: `ipcMain.handle('inject:text', ...)`

### 2. Feature-Area Detection (JoplinREA-style)

Detects broad feature areas across a real source tree:

| Area | What it finds |
|---|---|
| Notes / Markdown | Note storage, markdown rendering, data model modules |
| Sync / Cloud | Synchronization, Dropbox/OneDrive/WebDAV touchpoints |
| Encryption / E2EE | Key derivation, cipher usage, master key handling |
| Plugin System | Plugin registration, PluginService, hook points |
| Electron IPC | `ipcMain`, `ipcRenderer`, `contextBridge` usage |

Point it at any open-source Electron app (e.g., a Joplin clone) to get instant feature-area findings.

## Quick Start

```bash
# Clone and enter
git clone https://github.com/nulllabTests/EvidenceREA.git
cd EvidenceREA

# Run tests (28 tests, all passing)
npm test

# Analyze the synthetic fixture (pipeline mode)
node src/cli.js fixtures/wispr-like --mode pipeline

# Analyze a real Electron app (feature-area mode)
node src/cli.js /path/to/electron/app --mode features

# Both modes, JSON output
node src/cli.js fixtures/wispr-like --mode auto --format json

# Both modes, Markdown output
node src/cli.js fixtures/wispr-like --mode auto --format markdown
```

## What You Gain from Evidence-Backed Analysis

| Benefit | How EvidenceREA delivers |
|---|---|
| **Reproducibility** | Same input → same output. Deterministic, versioned, git-tracked. |
| **Agent hand-off** | JSON + Markdown output is directly consumable by coding agents. |
| **Clean-room work** | Evidence envelopes describe *what* exists without copying proprietary source. |
| **Onboarding** | New team members understand an unfamiliar Electron app's architecture in minutes. |
| **Security review** | IPC channels, contextBridge exposures, and preload boundaries are enumerated with file citations. |
| **Auditability** | Every claim has a confidence level and explicit limitations. No black-box reasoning. |
| **Extensibility** | Add new patterns, new feature areas, or new output formats without breaking existing analysis. |

## Repository Layout

```
EvidenceREA/
├── src/
│   ├── analyzer.js       # Core walker, IPC extraction, evidence envelopes
│   ├── feature-map.js    # Dual-mode feature map generator (pipeline + areas)
│   └── cli.js            # CLI entry with --mode and --format flags
├── fixtures/
│   └── wispr-like/       # Synthetic Electron app fixture (main + preload + renderer)
├── tests/
│   ├── analyzer.test.js  # 13 analyzer unit tests
│   ├── feature-map.test.js # 8 feature map tests
│   └── cli.test.js       # 7 CLI integration tests
├── intent.md             # SDLC: problem, desired outcome, users, constraints
├── spec.md               # SDLC: functional requirements (FR1–FR8)
├── plan.md               # SDLC: implementation order, risks, success criteria
├── CLAUDE.md             # Agent conventions and instructions
├── CONTRIBUTING.md       # Contribution guidelines
├── SECURITY.md           # Lawful use policy
├── LICENSE               # MIT
└── README.md             # This file
```

## Using on a New Target

### Open-source app

```bash
node src/cli.js /path/to/cloned/app --mode auto
```

### Your own app

Point it at your `app/` or `packages/app-desktop/` directory.

### Extracted binary

If you have an extracted Electron app directory (e.g., from an ASAR), point it at the `resources/app/` folder.

### Output as agent input

```bash
node src/cli.js /path/to/app --format json > evidence.json
# Feed evidence.json to a coding agent
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

Then add the corresponding finding block and feature-map entry.

### Future Extensions

- **ASAR archive parsing** — currently requires extracted directories
- **Native analysis hand-off** — Ghidra/Hopper integration for `.node` binaries
- **MCP skill** — wrap the CLI for agent-native consumption
- **TypeScript AST** — replace regex with tree-sitter for deeper analysis
- **Call-graph reconstruction** — trace IPC handlers to renderer call sites

## AI-Native SDLC

This repo follows the [AI-Native SDLC playbook](https://claude.com/blog/the-ai-native-sdlc-playbook):

| Stage | Artifact |
|---|---|
| Plan | `intent.md` — problem, desired outcome, users, constraints |
| Design | `spec.md` — functional requirements |
| Build | `plan.md` — implementation order |
| Test | `tests/` — 28 comprehensive, passing tests |
| Review | Evidence envelopes with confidence levels |
| Maintain | Versioned artifacts, git history |

The artifact chain lives next to the code. Every commit traces back to an intent.

## License

MIT. See [LICENSE](LICENSE).

## Lawful Use

**For lawful analysis of software you own or are authorized to examine only.** See [SECURITY.md](SECURITY.md).

---

Built as a demonstration of evidence-backed, agent-assisted static analysis of desktop applications. For authorized analysis and clean-room work only.
