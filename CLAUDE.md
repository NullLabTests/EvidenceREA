# EvidenceREA — Agent Instructions

## What This Is

EvidenceREA is a unified evidence-backed static analyzer for Electron applications. It combines two analysis styles:

1. **Pipeline Reconstruction** — reconstructs a specific feature path (e.g., hotkey → dictation → injection)
2. **Feature-Area Detection** — detects broad feature areas (notes, sync, plugins, encryption)

## Conventions

- Every finding MUST be an evidence envelope: `{ claim, evidence, confidence, limitations }`
- Confidence levels: `high`, `medium`, `low`
- Unknowns MUST be explicitly listed in `limitations`
- No external dependencies — Node.js built-ins only
- Tests use `node:test` and `node:assert`
- Deterministic output for the same input
- No network calls during analysis

## File Layout

- `src/analyzer.js` — core walker, IPC extraction, evidence envelope generation
- `src/feature-map.js` — dual-mode feature map generation (pipeline + feature areas)
- `src/cli.js` — CLI entry point
- `fixtures/wispr-like/` — synthetic Electron app fixture for testing
- `tests/` — unit and integration tests

## Running Tests

```bash
npm test
```

## Running the CLI

```bash
# Pipeline mode (FlowREA-style)
node src/cli.js fixtures/wispr-like --mode pipeline

# Feature-area mode (JoplinREA-style)
node src/cli.js /path/to/electron/app --mode features

# Auto mode (both)
node src/cli.js fixtures/wispr-like --mode auto

# JSON output only
node src/cli.js fixtures/wispr-like --format json

# Markdown output only
node src/cli.js fixtures/wispr-like --format markdown
```

## Adding New Analysis Patterns

1. Add detection logic to `src/analyzer.js`
2. Add corresponding feature map step to `src/feature-map.js`
3. Write a test in `tests/`
4. Run `npm test` to verify

## Key Principles

- Lawful use only — analyze software you own or are authorized to examine
- Clean-room approach — do not copy proprietary source
- Evidence must accompany every claim
- Output must be useful as input to a coding agent
