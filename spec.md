# Specification: EvidenceREA — Unified Evidence-Backed Analyzer for Electron Applications

## Overview

EvidenceREA is a local toolkit that applies evidence-backed static analysis to Electron applications. It unifies two analysis modes:

1. **Pipeline Reconstruction** (FlowREA-style): Reconstructs a specific user-visible feature path (e.g., hotkey → dictation → injection) from IPC channels and code patterns.
2. **Feature-Area Detection** (JoplinREA-style): Detects broad feature areas (notes, sync, plugins, encryption) across a real source tree.

Both modes produce consistent evidence envelopes and feature maps.

## Functional Requirements

### FR1: Unified Walker

- Accept a path to an Electron app directory (extracted or source tree)
- Recursively walk all `.js`, `.mjs`, `.cjs`, `.ts`, `.tsx` files
- Skip `node_modules` and dot-directories
- Output file list with relative paths and sizes

### FR2: IPC Channel Extraction

- Detect all Electron IPC patterns:
  - `ipcMain.handle('channel', ...)`
  - `ipcMain.on('channel', ...)`
  - `ipcRenderer.invoke('channel', ...)`
  - `ipcRenderer.send('channel', ...)`
  - `ipcRenderer.on('channel', ...)`
- Extract channel names as structured data
- Tag each channel with the file it was found in

### FR3: Evidence Envelopes

Every finding must include:
- `claim` — human-readable statement
- `evidence` — array of file paths, symbols, channel names
- `confidence` — `high` | `medium` | `low`
- `limitations` — array of explicit unknowns
- `provider` — identifier for the analysis mode

### FR4: Pipeline Reconstruction Mode

- Detect the voice-dictation pipeline:
  1. System hotkey (`globalShortcut.register`)
  2. Audio capture start/stop (`dictation:start`, `dictation:stop`)
  3. Transcription (unknown — mark explicitly)
  4. Text injection (`inject:text`, `clipboard`, `accessibility`)
- Generate a step-by-step feature map with evidence citations
- List explicit unknowns (native injection mechanism, transcription backend, audio capture details)

### FR5: Feature-Area Detection Mode

- Detect broad feature areas in real source trees:
  - Notes / Markdown handling
  - Sync / cloud synchronization
  - Encryption / E2EE
  - Plugin system
  - Electron IPC usage
  - contextBridge / preload exposure
- Generate per-area findings with file citations
- Include summary counts for each area

### FR6: Dual Mode Support

- Auto-detect or accept a `--mode` flag:
  - `pipeline` — FlowREA-style pipeline reconstruction
  - `features` — JoplinREA-style feature-area detection
  - `auto` — run both and merge results
- Output combined JSON + Markdown

### FR7: CLI Interface

- `node src/cli.js <path> [--mode pipeline|features|auto] [--format json|markdown|both]`
- Exit 0 on success, non-zero on error
- Print JSON to stdout, Markdown to stderr (or both to stdout with `--format both`)

### FR8: Fixture Mode

- Ship with a synthetic "wispr-like" fixture that exercises the analyzer
- Tests must pass against the fixture without requiring a real proprietary binary
- Document how to point at a real source tree

## Non-Functional Requirements

- Runs locally (Node.js ≥ 18, no external dependencies)
- No network calls during analysis
- Deterministic output for the same input
- MIT-licensed
- Follows AI-native SDLC: artifacts live in the repo
- All tests pass with `npm test`

## Out of Scope

- Full decompilation of proprietary native binaries
- Bypassing license checks or authentication
- Dynamic instrumentation of running processes
- ASAR archive parsing (documented as future extension)
- TypeScript type analysis (text-level regex only)

## Risks

- Analysis of real proprietary apps must remain authorized
- Native injection methods differ by OS and may require separate investigation
- Regex-based analysis may miss dynamically constructed channel names
- Large source trees may produce many findings; output should be structured

## Acceptance Criteria

- Given the fixture, analyzer emits at least one IPC channel related to "inject" or "clipboard" or "accessibility"
- Given the fixture, feature map lists hotkey, capture, and inject steps with evidence citations
- Given a real source tree (e.g., Joplin), feature-area detection finds notes, sync, plugins, encryption
- All unit tests pass
- CLI exits 0 on fixture and on a real source tree
