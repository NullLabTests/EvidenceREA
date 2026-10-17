# Intent: EvidenceREA — Unified Evidence-Backed Static Analyzer for Electron Applications

## Problem

Two prior projects demonstrated evidence-backed static analysis of Electron applications:

1. **FlowREA** — Synthetic fixture approach for a Wispr Flow-style voice-dictation Electron app. Used a hand-written fixture with `globalShortcut` + IPC channels (`dictation:start`, `dictation:stop`, `inject:text`). Produced evidence envelopes and a feature map for the hotkey → capture → transcription (unknown) → text-injection path.

2. **JoplinREA** — Real open-source target analysis. Scanned 400+ files in the actual Joplin desktop source tree (`packages/app-desktop`). Found concrete Electron IPC usage in `ElectronAppWrapper.ts`, `app.ts`, preload scripts, and `PluginRunner.ts`. Detected feature-area hits for notes, sync, plugins, and encryption.

Both projects produced evidence-backed findings, but they used separate codebases, separate analyzers, and separate output formats. There is no unified tool that handles both analysis styles.

## Desired Outcome

A single polished, git-tracked repository called **EvidenceREA** that:

- Combines the strongest ideas from both projects into one coherent tool
- Explains both examples clearly (voice-dictation pipeline + Joplin feature areas)
- Shows what can be gained from evidence-backed analysis (reproducibility, agent hand-off, clean-room work, onboarding, security review)
- Teaches how to apply the same method to new targets
- Follows the AI-native SDLC (Anthropic-style) with versioned artifacts
- Ships with comprehensive tests that pass for both analysis styles
- Outputs machine-readable JSON + human-readable Markdown

## Users

- **Independent developers** building local or privacy-focused Electron apps who want to understand existing patterns
- **AI agent researchers** who need programmatic analysis of desktop app architectures
- **Security researchers** performing authorized analysis of desktop clients
- **Open-source maintainers** who want to document their app's attack surface and IPC boundaries
- **Coding agents** that consume the output as input for clean-room reimplementation

## Constraints

- Lawful use only: analyze software the user owns or is explicitly authorized to examine
- Clean-room approach: observe structure and behavior; do not copy proprietary source
- Local analysis only; no network calls during analysis
- Every finding must be an evidence envelope (claim, evidence, confidence, limitations)
- Unknowns must be explicitly marked
- Deterministic output for the same input
- Node.js with no external dependencies for the core
- MIT-licensed
- Compatible with AI-native SDLC artifacts (intent → spec → plan → code + tests)

## Success Criteria

- Analyzer runs against both a synthetic fixture AND real source trees
- Tests pass covering both pipeline reconstruction and feature-area detection
- Output is sufficient for an agent to generate a starter clean-room implementation
- README and SDLC artifacts are complete and version-controlled
- The repo serves as a template for analyzing other Electron applications
