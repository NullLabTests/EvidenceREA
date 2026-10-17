# Security Policy

## Lawful Use Only

EvidenceREA is designed for **lawful analysis of software you own or are explicitly authorized to examine**. This includes:

- Open-source software (MIT, AGPL, Apache, etc.)
- Your own applications
- Applications you have written authorization to analyze
- Security research within responsible disclosure frameworks

## Prohibited Uses

- Analyzing proprietary software without authorization
- Bypassing license checks or authentication
- Decompiling native binaries without proper legal standing
- Using findings to create counterfeit or infringing products
- Any activity applicable laws

## Evidence-Backed Approach

Every finding produced by EvidenceREA is an evidence envelope with:

- **Claim** — what was observed
- **Evidence** — file paths, symbols, channel names
- **Confidence** — certainty level
- **Limitations** — explicit unknowns

This ensures all output is auditable, reproducible, and suitable for clean-room reimplementation.

## Reporting Issues

If you discover a security issue in EvidenceREA itself, please report it responsibly:

1. Open a private security advisory on GitHub
2. Do not exploit the issue while it is being addressed
3. Allow reasonable time for a fix before public disclosure

## Disclaimer

This tool is provided for educational and lawful research purposes only. Users are solely responsible for ensuring their use complies with all applicable laws and license agreements.
