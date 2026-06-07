import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { createDeflateRaw } from 'node:zlib';

let _crc32Table: Uint32Array | undefined;
function crc32Table(): Uint32Array {
  if (_crc32Table) return _crc32Table;
  _crc32Table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    _crc32Table[i] = c;
  }
  return _crc32Table;
}

function crc32(buf: Buffer): number {
  const table = crc32Table();
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ (table[(crc ^ buf[i]!) & 0xff] ?? 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function deflate(input: Buffer): Promise<Buffer> {
  return new Promise((resolveDeflate, reject) => {
    const chunks: Buffer[] = [];
    const d = createDeflateRaw({ level: 6 });
    d.on('data', (c: Buffer) => chunks.push(c));
    d.on('end', () => resolveDeflate(Buffer.concat(chunks)));
    d.on('error', reject);
    d.end(input);
  });
}

function u16(n: number): Buffer {
  const b = Buffer.allocUnsafe(2);
  b.writeUInt16LE(n, 0);
  return b;
}

function u32(n: number): Buffer {
  const b = Buffer.allocUnsafe(4);
  b.writeUInt32LE(n >>> 0, 0);
  return b;
}

export type ZipEntry = { name: string; content: Buffer };

export async function createZipBuffer(entries: ZipEntry[]): Promise<Buffer> {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf8');
    const checksum = crc32(entry.content);
    const compressed = await deflate(entry.content);
    const method = compressed.length < entry.content.length ? 8 : 0;
    const data = method === 8 ? compressed : entry.content;

    const local = Buffer.concat([
      Buffer.from([0x50, 0x4b, 0x03, 0x04]),
      u16(20),
      u16(0),
      u16(method),
      u16(0),
      u16(0),
      u32(checksum),
      u32(data.length),
      u32(entry.content.length),
      u16(nameBuf.length),
      u16(0),
      nameBuf,
      data,
    ]);

    centralParts.push(
      Buffer.concat([
        Buffer.from([0x50, 0x4b, 0x01, 0x02]),
        u16(20),
        u16(20),
        u16(0),
        u16(method),
        u16(0),
        u16(0),
        u32(checksum),
        u32(data.length),
        u32(entry.content.length),
        u16(nameBuf.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset),
        nameBuf,
      ]),
    );

    localParts.push(local);
    offset += local.length;
  }

  const central = Buffer.concat(centralParts);
  const eocd = Buffer.concat([
    Buffer.from([0x50, 0x4b, 0x05, 0x06]),
    u16(0),
    u16(0),
    u16(entries.length),
    u16(entries.length),
    u32(central.length),
    u32(offset),
    u16(0),
  ]);

  return Buffer.concat([...localParts, central, eocd]);
}

async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const results: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await listFiles(full)));
    } else {
      results.push(full);
    }
  }
  return results;
}

export async function writeZip(srcDir: string, outPath: string): Promise<void> {
  const files = await listFiles(srcDir);
  const entries: ZipEntry[] = await Promise.all(
    files
      .filter((f) => f !== outPath)
      .map(async (f) => ({
        name: relative(srcDir, f).replace(/\\/g, '/'),
        content: await readFile(f),
      })),
  );
  const buf = await createZipBuffer(entries);
  await writeFile(outPath, buf);
}
