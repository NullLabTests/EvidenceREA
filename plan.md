# Implementation Plan: EvidenceREA v2

## Goal

Deliver a working, tested Node.js CLI and library that unifies evidence-backed static analysis for Electron applications, supporting both pipeline reconstruction and feature-area detection.

## Files to Create

1. `package.json` — project metadata, scripts, no external deps, v2.0.0
2. `src/analyzer.js` — unified walker, IPC extraction, evidence envelopes
3. `src/feature-map.js` — dual-mode feature map generator
4. `src/cli.js` — command-line entry with mode/format flags
5. `fixtures/wispr-like/` — synthetic Electron structure with preload, main, renderer
6. `tests/analyzer.test.js` — unit tests for analyzer
7. `tests/feature-map.test.js` — unit tests for feature map
8. `tests/cli.test.js` — integration tests for CLI
9. `README.md` — comprehensive documentation
10. `LICENSE` — MIT
11. `CONTRIBUTING.md` — contribution guidelines
12. `SECURITY.md` — lawful use policy
13. `CLAUDE.md` — agent instructions
14. `.gitignore` — standard Node.js ignores

## Order of Implementation

1. Write SDLC artifacts (intent.md, spec.md, plan.md, CLAUDE.md)
2. Create fixture directory structure with realistic files
3. Implement `src/analyzer.js` — core static analysis
4. Implement `src/feature-map.js` — dual-mode feature maps
5. Write tests for analyzer and feature-map
6. Implement `src/cli.js` — CLI with mode/format flags
7. Write CLI integration tests
8. Run all tests, fix failures
9. Polish README, LICENSE, CONTRIBUTING, SECURITY
10. Commit with meaningful messages
11. Push to GitHub as `nulllabtests/EvidenceREA`

## Tests

- Analyzer finds preload and main entry in fixture
- Extracts IPC channels: `dictation:start`, `dictation:stop`, `inject:text`
- Detects `globalShortcut` usage
- Detects `contextBridge.exposeInMainWorld`
- Pipeline mode produces hotkey, capture, inject steps
- Feature-area mode detects notes, sync, plugins, encryption keywords
- Evidence envelopes have claim, evidence, confidence, limitations
- CLI exits 0 on fixture
- CLI produces valid JSON output
- CLI produces valid Markdown output

## Risks & Mitigations

- Real ASAR parsing is complex → start with extracted directory support; document ASAR as future
- No external deps → use only Node.js built-ins (fs, path, node:test)
- Proprietary target → only ship fixture; README stresses lawful use
- Regex may miss dynamic channel names → document limitation in evidence envelopes

## Success

`npm test` passes and `node src/cli.js fixtures/wispr-like` produces valid output for both modes.
