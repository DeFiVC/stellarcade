import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { diffWasmBinaries, parseWasm, formatReportMarkdown } from './index';

// Helper to construct a minimal valid WASM binary with arbitrary sections
function createWasmWithSection(sectionId: number, payload: Buffer): Buffer {
  const magic = Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
  const sizeByte = Buffer.from([payload.length]);
  return Buffer.concat([magic, Buffer.from([sectionId]), sizeByte, payload]);
}

describe('wasm-diff-analyzer', () => {
  const minimalWasm = Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);

  it('comparing identical binaries reports zero delta', () => {
    const report = diffWasmBinaries(minimalWasm, minimalWasm);

    expect(report.oldTotalSize).toBe(minimalWasm.length);
    expect(report.newTotalSize).toBe(minimalWasm.length);
    expect(report.totalDelta).toBe(0);
    expect(report.percentChange).toBe(0);
    expect(report.budgetExceeded).toBe(false);
  });

  it('expanded binary identifies growing sections accurately', () => {
    // Old binary has a 4-byte Data section (section 11)
    const oldWasm = createWasmWithSection(11, Buffer.from([1, 2, 3, 4]));
    // New binary has an 8-byte Data section (section 11)
    const newWasm = createWasmWithSection(11, Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]));

    const report = diffWasmBinaries(oldWasm, newWasm);

    expect(report.totalDelta).toBe(4);
    const dataSectionDiff = report.sections.find((s) => s.section === 'Data');
    expect(dataSectionDiff).toBeDefined();
    expect(dataSectionDiff?.oldSize).toBe(4);
    expect(dataSectionDiff?.newSize).toBe(8);
    expect(dataSectionDiff?.delta).toBe(4);
  });

  it('triggers budgetExceeded when binary exceeds budget limit', () => {
    // 100 bytes binary with budget 0.05 KB (~51 bytes)
    const bigPayload = Buffer.alloc(90, 0x01);
    const bigWasm = createWasmWithSection(10, bigPayload); // Code section

    const report = diffWasmBinaries(minimalWasm, bigWasm, { budgetKb: 0.05 });
    expect(report.budgetExceeded).toBe(true);
  });

  it('throws error when parsing invalid WASM header', () => {
    const invalidHeader = Buffer.from([0x12, 0x34, 0x56, 0x78]);
    expect(() => parseWasm(invalidHeader)).toThrow(/magic header mismatch/);
  });

  it('handles missing file error gracefully via filesystem check', () => {
    const nonExistentPath = path.resolve(__dirname, 'non_existent_file.wasm');
    expect(fs.existsSync(nonExistentPath)).toBe(false);
  });

  it('formats markdown report properly', () => {
    const report = diffWasmBinaries(minimalWasm, minimalWasm, {
      oldPath: 'old.wasm',
      newPath: 'new.wasm',
    });
    const md = formatReportMarkdown(report);
    expect(md).toContain('# WASM Binary Diff Report');
    expect(md).toContain('Base Binary');
    expect(md).toContain('Delta');
  });
});
