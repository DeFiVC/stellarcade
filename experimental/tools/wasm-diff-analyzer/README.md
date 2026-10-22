# WASM Diff Analyzer CLI

A CLI tool for analyzing size bloat and symbol deltas between Soroban contract WASM binaries.

## Features
- **Section Parsing**: Parses all standard WebAssembly sections (Code, Data, Export, Custom, etc.).
- **Byte and KB Delta Analysis**: Compares base vs new binary sizes per section.
- **Budget & 64KB Ceiling Warnings**: Flags builds approaching or exceeding the 64KB Soroban network threshold.
- **Symbol / Export Tracking**: Identifies newly added or removed exports.
- **Markdown & JSON Output**: Produces PR-ready summary reports.

## Usage

```bash
# Compare two contract WASM binaries
wasm-diff-analyzer --old path/to/contract_v1.wasm --new path/to/contract_v2.wasm

# Output as JSON
wasm-diff-analyzer --old old.wasm --new new.wasm --json

# Set custom size budget limit (e.g. 50 KB)
wasm-diff-analyzer --old old.wasm --new new.wasm --budget 50
```

## Running Tests

```bash
npm test
```
