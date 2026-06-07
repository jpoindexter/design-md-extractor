import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { afterEach, describe, expect, it } from 'vitest';
import { createZipBuffer, writeZip } from '../../src/io/zip.js';

let tmpDir = '';

afterEach(async () => {
  if (tmpDir) {
    await rm(tmpDir, { recursive: true, force: true });
    tmpDir = '';
  }
});

// Independent CRC-32 (not the impl under test) so the round-trip assertion
// catches a wrong checksum — a bad CRC passes name/content checks but makes a
// real OS unzip report a corrupt archive.
function independentCrc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]!;
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Minimal local-header reader: decodes every entry's name and content so tests
// can assert a real archive, not just magic bytes. Inflates method-8 entries,
// copies method-0 (stored) verbatim, and validates the stored CRC matches the
// decompressed bytes (this is what `unzip -t` checks).
function readZipEntries(buf: Buffer): Map<string, Buffer> {
  const out = new Map<string, Buffer>();
  let i = 0;
  while (i + 4 <= buf.length && buf.readUInt32LE(i) === 0x04034b50) {
    const method = buf.readUInt16LE(i + 8);
    const storedCrc = buf.readUInt32LE(i + 14);
    const compSize = buf.readUInt32LE(i + 18);
    const nameLen = buf.readUInt16LE(i + 26);
    const extraLen = buf.readUInt16LE(i + 28);
    const nameStart = i + 30;
    const dataStart = nameStart + nameLen + extraLen;
    const name = buf.toString('utf8', nameStart, nameStart + nameLen);
    const raw = buf.subarray(dataStart, dataStart + compSize);
    const content = method === 8 ? inflateRawSync(raw) : Buffer.from(raw);
    if (independentCrc32(content) !== storedCrc) {
      throw new Error(`CRC mismatch for entry "${name}"`);
    }
    out.set(name, content);
    i = dataStart + compSize;
  }
  return out;
}

describe('createZipBuffer', () => {
  it('produces a buffer with ZIP magic bytes and EOCD record', async () => {
    const buf = await createZipBuffer([
      { name: 'hello.txt', content: Buffer.from('Hello, World!') },
      { name: 'dir/nested.txt', content: Buffer.from('Nested') },
    ]);

    expect(buf[0]).toBe(0x50);
    expect(buf[1]).toBe(0x4b);
    expect(buf[2]).toBe(0x03);
    expect(buf[3]).toBe(0x04);

    const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
    expect(eocd).toBeGreaterThan(0);
  });

  it('round-trips entry names and contents through the archive', async () => {
    // Large repeating payload guarantees method-8 (deflate) is exercised.
    const big = Buffer.from('design tokens '.repeat(500));
    const buf = await createZipBuffer([
      { name: 'hello.txt', content: Buffer.from('Hello, World!') },
      { name: 'dir/nested.txt', content: big },
    ]);

    const entries = readZipEntries(buf);
    expect(entries.get('hello.txt')?.toString('utf8')).toBe('Hello, World!');
    expect(entries.get('dir/nested.txt')?.equals(big)).toBe(true);
  });

  it('produces a non-empty buffer for empty entries', async () => {
    const buf = await createZipBuffer([]);
    expect(buf.length).toBeGreaterThan(0);
    const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
    expect(eocd).toBeGreaterThanOrEqual(0);
  });
});

describe('writeZip', () => {
  it('zips a directory tree into an output file with valid ZIP magic', async () => {
    tmpDir = join(tmpdir(), `zip-test-${process.pid}-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });
    await writeFile(join(tmpDir, 'a.txt'), 'file a');
    await writeFile(join(tmpDir, 'b.txt'), 'file b');
    await mkdir(join(tmpDir, 'sub'));
    await writeFile(join(tmpDir, 'sub', 'c.txt'), 'file c');

    const outPath = join(tmpdir(), `out-${process.pid}-${Date.now()}.zip`);
    try {
      await writeZip(tmpDir, outPath);
      const bytes = await readFile(outPath);
      expect(bytes[0]).toBe(0x50);
      expect(bytes[1]).toBe(0x4b);
      expect(bytes.length).toBeGreaterThan(100);

      const entries = readZipEntries(bytes);
      expect(entries.get('a.txt')?.toString('utf8')).toBe('file a');
      expect(entries.get('b.txt')?.toString('utf8')).toBe('file b');
      expect(entries.get('sub/c.txt')?.toString('utf8')).toBe('file c');
    } finally {
      await rm(outPath, { force: true });
    }
  });

  it('excludes the output file when it lives inside the source dir', async () => {
    tmpDir = join(tmpdir(), `zip-self-${process.pid}-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });
    await writeFile(join(tmpDir, 'keep.txt'), 'keep me');
    const outPath = join(tmpDir, 'bundle.zip');

    await writeZip(tmpDir, outPath);
    const bytes = await readFile(outPath);
    const entries = readZipEntries(bytes);

    expect(entries.has('keep.txt')).toBe(true);
    expect(entries.has('bundle.zip')).toBe(false);
  });
});
