# Contributing to EvidenceREA

Thank you for your interest in contributing. This document describes how to get started.

## Development Setup

```bash
git clone https://github.com/nulllabtests/EvidenceREA.git
cd EvidenceREA
npm test
```

No external dependencies. Node.js ≥ 18 required.

## Running Tests

```bash
npm test
```

All tests must pass before submitting a change.

## Project Structure

- `src/analyzer.js` — core static analysis
- `src/feature-map.js` — feature map generation
- `src/cli.js` — CLI entry point
- `fixtures/` — synthetic test fixtures
- `tests/` — unit and integration tests

## Adding a New Analysis Pattern

1. Add detection logic to `src/analyzer.js`
2. Add corresponding feature map step to `src/feature-map.js`
3. Write a test in `tests/`
4. Run `npm test`

## Code Conventions

- No external dependencies — Node.js built-ins only
- Every finding MUST be an evidence envelope: `{ claim, evidence, confidence, limitations }`
- Confidence levels: `high`, `medium`, `low`
- Unknowns MUST be explicitly listed in `limitations`
- Tests use `node:test` and `node:assert`
- Deterministic output for the same input

## Commit Messages

Use meaningful commit messages:

```
feat: add IPC channel extraction for removeHandler
test: add contextBridge detection test
docs: update README with new mode
fix: handle empty directories in walker
```

## Pull Requests

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure `npm test` passes
5. Submit a PR with a clear description

## SDLC Artifacts

When making substantial changes, update the relevant SDLC artifact:

- `intent.md` — if the problem or desired outcome changes
- `spec.md` — if functional requirements change
- `plan.md` — if implementation order changes
- `CLAUDE.md` — if conventions change
