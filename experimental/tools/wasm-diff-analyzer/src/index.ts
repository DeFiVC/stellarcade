import fs from 'fs';
import path from 'path';
import { Command } from 'commander';

const WASM_MAGIC = Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
export const SOROBAN_NETWORK_CEILING_BYTES = 64 * 1024; // 64 KB

export const SECTION_NAMES: Record<number, string> = {
  0: 'Custom',
  1: 'Type',
  2: 'Import',
  3: 'Function',
  4: 'Table',
  5: 'Memory',
  6: 'Global',
  7: 'Export',
  8: 'Start',
  9: 'Element',
  10: 'Code',
  11: 'Data',
  12: 'DataCount',
};

export interface WasmExportItem {
  name: string;
  kind: number; // 0 = func, 1 = table, 2 = mem, 3 = global
  index: number;
}

export interface ParsedSection {
  id: number;
  name: string;
  customName?: string;
  size: number;
  payload: Buffer;
  exports?: WasmExportItem[];
}

export interface WasmAnalysis {
  totalSize: number;
  sections: ParsedSection[];
  sectionSizeMap: Record<string, number>;
  exports: string[];
}

export interface SectionDiff {
  section: string;
  oldSize: number;
  newSize: number;
  delta: number;
}

export interface WasmDiffReport {
  oldPath?: string;
  newPath?: string;
  oldTotalSize: number;
  newTotalSize: number;
  totalDelta: number;
  percentChange: number;
  sections: SectionDiff[];
  addedExports: string[];
  removedExports: string[];
  commonExports: string[];
  budgetWarning: boolean;
  budgetExceeded: boolean;
  budgetLimitBytes?: number;
}

export function readLeb128(buffer: Buffer, offset: number): { value: number; bytesRead: number } {
  let result = 0;
  let shift = 0;
  let bytesRead = 0;
  while (offset + bytesRead < buffer.length) {
    const byte = buffer[offset + bytesRead];
    bytesRead++;
    result |= (byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) break;
    shift += 7;
  }
  return { value: result, bytesRead };
}

export function parseExports(payload: Buffer): WasmExportItem[] {
  const exports: WasmExportItem[] = [];
  try {
    let offset = 0;
    const { value: count, bytesRead } = readLeb128(payload, offset);
    offset += bytesRead;

    for (let i = 0; i < count && offset < payload.length; i++) {
      const { value: nameLen, bytesRead: nameLenBytes } = readLeb128(payload, offset);
      offset += nameLenBytes;
      const name = payload.subarray(offset, offset + nameLen).toString('utf8');
      offset += nameLen;

      if (offset < payload.length) {
        const kind = payload[offset++];
        const { value: index, bytesRead: idxBytes } = readLeb128(payload, offset);
        offset += idxBytes;
        exports.push({ name, kind, index });
      }
    }
  } catch {
    // Gracefully handle partial/malformed exports
  }
  return exports;
}

export function parseWasm(buffer: Buffer): WasmAnalysis {
  if (buffer.length < 8 || !buffer.subarray(0, 8).equals(WASM_MAGIC)) {
    throw new Error('Invalid WASM binary: magic header mismatch');
  }

  const sections: ParsedSection[] = [];
  const sectionSizeMap: Record<string, number> = {};
  const exports: string[] = [];
  let offset = 8;

  while (offset < buffer.length) {
    const id = buffer[offset++];
    const { value: size, bytesRead } = readLeb128(buffer, offset);
    offset += bytesRead;

    const payload = buffer.subarray(offset, offset + size);
    offset += size;

    let customName: string | undefined;
    if (id === 0) {
      try {
        const { value: nameLen, bytesRead: nlBytes } = readLeb128(payload, 0);
        customName = payload.subarray(nlBytes, nlBytes + nameLen).toString('utf8');
      } catch {
        customName = 'unknown_custom';
      }
    }

    const sectionKey = id === 0 && customName ? `Custom (${customName})` : SECTION_NAMES[id] || `Section_${id}`;
    let parsedExports: WasmExportItem[] | undefined;

    if (id === 7) {
      parsedExports = parseExports(payload);
      parsedExports.forEach((exp) => exports.push(exp.name));
    }

    sections.push({
      id,
      name: SECTION_NAMES[id] || `Section_${id}`,
      customName,
      size,
      payload,
      exports: parsedExports,
    });

    sectionSizeMap[sectionKey] = (sectionSizeMap[sectionKey] || 0) + size;
  }

  return {
    totalSize: buffer.length,
    sections,
    sectionSizeMap,
    exports,
  };
}

export function diffWasmBinaries(
  oldBuffer: Buffer,
  newBuffer: Buffer,
  options: { budgetKb?: number; oldPath?: string; newPath?: string } = {}
): WasmDiffReport {
  const oldParsed = parseWasm(oldBuffer);
  const newParsed = parseWasm(newBuffer);

  const allSectionKeys = Array.from(
    new Set([...Object.keys(oldParsed.sectionSizeMap), ...Object.keys(newParsed.sectionSizeMap)])
  );

  const sections: SectionDiff[] = allSectionKeys.map((section) => {
    const oldSize = oldParsed.sectionSizeMap[section] || 0;
    const newSize = newParsed.sectionSizeMap[section] || 0;
    return {
      section,
      oldSize,
      newSize,
      delta: newSize - oldSize,
    };
  });

  // Sort sections by descending absolute delta
  sections.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  const totalDelta = newParsed.totalSize - oldParsed.totalSize;
  const percentChange = oldParsed.totalSize > 0 ? (totalDelta / oldParsed.totalSize) * 100 : 0;

  const oldExportsSet = new Set(oldParsed.exports);
  const newExportsSet = new Set(newParsed.exports);

  const addedExports = newParsed.exports.filter((e) => !oldExportsSet.has(e));
  const removedExports = oldParsed.exports.filter((e) => !newExportsSet.has(e));
  const commonExports = newParsed.exports.filter((e) => oldExportsSet.has(e));

  const budgetLimitBytes = options.budgetKb ? options.budgetKb * 1024 : SOROBAN_NETWORK_CEILING_BYTES;
  const budgetExceeded = newParsed.totalSize > budgetLimitBytes;
  const budgetWarning = newParsed.totalSize >= budgetLimitBytes * 0.9;

  return {
    oldPath: options.oldPath,
    newPath: options.newPath,
    oldTotalSize: oldParsed.totalSize,
    newTotalSize: newParsed.totalSize,
    totalDelta,
    percentChange,
    sections,
    addedExports,
    removedExports,
    commonExports,
    budgetWarning,
    budgetExceeded,
    budgetLimitBytes,
  };
}

export function formatReportMarkdown(report: WasmDiffReport): string {
  const deltaKb = (report.totalDelta / 1024).toFixed(2);
  const sign = report.totalDelta > 0 ? '+' : '';

  let md = `# WASM Binary Diff Report\n\n`;
  if (report.oldPath && report.newPath) {
    md += `- **Base Binary**: \`${report.oldPath}\`\n`;
    md += `- **New Binary**: \`${report.newPath}\`\n\n`;
  }
  md += `### Size Overview\n`;
  md += `- **Base Size**: ${(report.oldTotalSize / 1024).toFixed(2)} KB (${report.oldTotalSize} bytes)\n`;
  md += `- **New Size**: ${(report.newTotalSize / 1024).toFixed(2)} KB (${report.newTotalSize} bytes)\n`;
  md += `- **Delta**: ${sign}${deltaKb} KB (${sign}${report.totalDelta} bytes, ${report.percentChange.toFixed(2)}%)\n\n`;

  if (report.budgetExceeded) {
    md += `> ⚠️ **ALERT: Size Budget Exceeded!** Binary is ${(report.newTotalSize / 1024).toFixed(2)} KB (Limit: ${(report.budgetLimitBytes! / 1024).toFixed(2)} KB)\n\n`;
  } else if (report.budgetWarning) {
    md += `> ⚠️ **WARNING: Binary size approaching 64KB network ceiling!**\n\n`;
  }

  md += `### Section Breakdown\n\n`;
  md += `| Section | Base (Bytes) | New (Bytes) | Delta (Bytes) | Delta (KB) |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- |\n`;
  for (const s of report.sections) {
    const sDeltaSign = s.delta > 0 ? '+' : '';
    md += `| ${s.section} | ${s.oldSize} | ${s.newSize} | ${sDeltaSign}${s.delta} | ${sDeltaSign}${(s.delta / 1024).toFixed(2)} |\n`;
  }

  if (report.addedExports.length > 0 || report.removedExports.length > 0) {
    md += `\n### Symbol / Export Changes\n`;
    if (report.addedExports.length > 0) {
      md += `- **Added Exports**: ${report.addedExports.map((e) => `\`${e}\``).join(', ')}\n`;
    }
    if (report.removedExports.length > 0) {
      md += `- **Removed Exports**: ${report.removedExports.map((e) => `\`${e}\``).join(', ')}\n`;
    }
  }

  return md;
}

export function runCli(): void {
  const program = new Command();

  program
    .name('wasm-diff-analyzer')
    .description('Compare two Soroban WASM binaries and report section/symbol deltas')
    .requiredOption('-o, --old <file>', 'Path to base/old WASM file')
    .requiredOption('-n, --new <file>', 'Path to new WASM file')
    .option('-j, --json', 'Output report in JSON format')
    .option('-m, --markdown', 'Output report in Markdown format')
    .option('-b, --budget <kb>', 'Size budget limit in KB (default: 64)', parseFloat)
    .action((options) => {
      const oldPath = path.resolve(options.old);
      const newPath = path.resolve(options.new);

      if (!fs.existsSync(oldPath)) {
        console.error(`Error: Base file not found at ${oldPath}`);
        process.exit(1);
      }
      if (!fs.existsSync(newPath)) {
        console.error(`Error: New file not found at ${newPath}`);
        process.exit(1);
      }

      const oldBuf = fs.readFileSync(oldPath);
      const newBuf = fs.readFileSync(newPath);

      const report = diffWasmBinaries(oldBuf, newBuf, {
        budgetKb: options.budget,
        oldPath: options.old,
        newPath: options.new,
      });

      if (options.json) {
        console.log(JSON.stringify(report, null, 2));
      } else if (options.markdown) {
        console.log(formatReportMarkdown(report));
      } else {
        console.log(formatReportMarkdown(report));
      }

      if (report.budgetExceeded) {
        process.exit(2);
      }
    });

  program.parse(process.argv);
}

if (require.main === module) {
  runCli();
}
