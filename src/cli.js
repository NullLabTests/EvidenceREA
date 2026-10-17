#!/usr/bin/env node
/**
 * EvidenceREA CLI
 * Usage: node src/cli.js <path> [--mode pipeline|features|auto] [--format json|markdown|both]
 */

const path = require('path');
const { analyze } = require('./analyzer');
const { buildPipelineMap, buildFeatureAreaMap, buildAllMaps, toMarkdown } = require('./feature-map');

function parseArgs(argv) {
  const args = { target: null, mode: 'auto', format: 'both' };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--mode' && i + 1 < argv.length) {
      args.mode = argv[++i];
    } else if (arg === '--format' && i + 1 < argv.length) {
      args.format = argv[++i];
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else {
      positional.push(arg);
    }
  }
  if (positional.length > 0) args.target = positional[0];
  return args;
}

function printHelp() {
  console.log(`
EvidenceREA — Evidence-Backed Static Analyzer for Electron Applications

Usage:
  node src/cli.js <path> [options]

Options:
  --mode <mode>       Analysis mode: pipeline | features | auto (default: auto)
  --format <format>   Output format: json | markdown | both (default: both)
  --help, -h          Show this help message

Examples:
  node src/cli.js fixtures/wispr-like --mode pipeline
  node src/cli.js /path/to/electron/app --mode features
  node src/cli.js fixtures/wispr-like --format json
  node src/cli.js fixtures/wispr-like --format markdown
`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (!args.target) {
    console.error('Error: No target path provided.');
    printHelp();
    process.exit(1);
  }

  const resolved = path.resolve(args.target);
  const fs = require('fs');
  if (!fs.existsSync(resolved)) {
    console.error(`Error: Path does not exist: ${resolved}`);
    process.exit(1);
  }

  const envelope = analyze(resolved);

  let output = {};
  if (args.mode === 'pipeline') {
    output = { envelope, featureMap: buildPipelineMap(envelope) };
  } else if (args.mode === 'features') {
    output = { envelope, featureMap: buildFeatureAreaMap(envelope) };
  } else {
    output = { envelope, ...buildAllMaps(envelope) };
  }

  if (args.format === 'json' || args.format === 'both') {
    console.log(JSON.stringify(output, null, 2));
  }

  if (args.format === 'markdown' || args.format === 'both') {
    const map = args.mode === 'pipeline' ? buildPipelineMap(envelope)
      : args.mode === 'features' ? buildFeatureAreaMap(envelope)
      : buildAllMaps(envelope);
    const md = args.mode === 'auto'
      ? toMarkdown(map.pipeline, envelope.modules) + '\n\n' + toMarkdown(map.features)
      : toMarkdown(map, envelope.modules);
    if (args.format === 'both') {
      console.error('\n--- Feature Map (Markdown) ---\n');
      console.error(md);
    } else {
      console.log(md);
    }
  }
}

main();
