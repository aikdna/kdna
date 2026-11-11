// Dependency-free KDNA container reader shared by the static inspector page and
// its node test. The build script inlines this file (minus `export`) into
// docs/inspector/index.html, so it must only use APIs present in both modern
// browsers and Node: Uint8Array, TextDecoder, DecompressionStream, crypto.subtle.
// It reads the ZIP container and the public JSON manifest only. It never
// decrypts, never decodes judgment payload frames, and never touches the network.

export const KDNA_MIMETYPE = 'application/vnd.kdna.asset';
export const LIMITS = Object.freeze({
  maxContainerBytes: 64 * 1024 * 1024,
  maxEntries: 256,
  maxEntryBytes: 64 * 1024 * 1024,
  maxManifestBytes: 4 * 1024 * 1024,
});

export class InspectError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'InspectError';
    this.code = code;
  }
}

function fail(code, message) {
  throw new InspectError(code, message);
}

async function inflateRaw(bytes) {
  if (typeof DecompressionStream !== 'function') {
    fail(
      'KDNA_UNSUPPORTED_BROWSER',
      'This browser lacks DecompressionStream for deflated entries.',
    );
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Parse a ZIP archive into [{name, method, size, data}] with strict bounds. */
export async function readZip(input) {
  const buf = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (buf.length > LIMITS.maxContainerBytes) {
    fail('KDNA_TOO_LARGE', `Container exceeds ${LIMITS.maxContainerBytes} bytes.`);
  }
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) fail('KDNA_NOT_A_CONTAINER', 'Not a .kdna container (no ZIP end record).');
  const total = view.getUint16(eocd + 10, true);
  let p = view.getUint32(eocd + 16, true);
  if (total > LIMITS.maxEntries) fail('KDNA_TOO_MANY_ENTRIES', 'Container has too many entries.');
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const entries = [];
  const seen = new Set();
  for (let n = 0; n < total; n++) {
    if (p + 46 > buf.length || view.getUint32(p, true) !== 0x02014b50) {
      fail('KDNA_BAD_ZIP', 'Corrupt ZIP central directory.');
    }
    const flags = view.getUint16(p + 8, true);
    const method = view.getUint16(p + 10, true);
    const compSize = view.getUint32(p + 20, true);
    const size = view.getUint32(p + 24, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    const local = view.getUint32(p + 42, true);
    let name;
    try {
      name = decoder.decode(buf.subarray(p + 46, p + 46 + nameLen));
    } catch {
      fail('KDNA_BAD_ENTRY_NAME', 'Entry name is not valid UTF-8.');
    }
    if (flags & 1) fail('KDNA_BAD_ZIP', `Entry ${name} uses ZIP encryption, which KDNA does not.`);
    if (
      !name ||
      name.startsWith('/') ||
      name.includes('\\') ||
      name.split('/').some((part) => part === '..' || part === '.')
    ) {
      fail('KDNA_BAD_ENTRY_NAME', `Unsafe entry name: ${name}`);
    }
    if (seen.has(name)) fail('KDNA_BAD_ZIP', `Duplicate entry: ${name}`);
    seen.add(name);
    if (size > LIMITS.maxEntryBytes) fail('KDNA_TOO_LARGE', `Entry ${name} is too large.`);
    if (local + 30 > buf.length || view.getUint32(local, true) !== 0x04034b50) {
      fail('KDNA_BAD_ZIP', `Bad local header for ${name}.`);
    }
    const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
    if (start + compSize > buf.length) fail('KDNA_BAD_ZIP', `Entry ${name} is truncated.`);
    const comp = buf.subarray(start, start + compSize);
    let data;
    if (method === 0) data = comp;
    else if (method === 8) data = await inflateRaw(comp);
    else fail('KDNA_BAD_ZIP', `Unsupported compression method ${method} for ${name}.`);
    if (data.length !== size) fail('KDNA_BAD_ZIP', `Entry size mismatch for ${name}.`);
    entries.push({ name, method, size, data });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

async function sha256Hex(bytes) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return null;
  const digest = new Uint8Array(await subtle.digest('SHA-256', bytes));
  return [...digest].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Inspect a .kdna container. Returns a plain report; throws InspectError for
 * structural problems. An encrypted payload is reported, not an error.
 */
export async function inspectKdna(input) {
  const entries = await readZip(input);
  const byName = new Map(entries.map((e) => [e.name, e]));
  const mimeEntry = byName.get('mimetype');
  const manifestEntry = byName.get('kdna.json');
  if (!manifestEntry) fail('KDNA_MANIFEST_MISSING', 'Container has no kdna.json manifest.');
  if (manifestEntry.size > LIMITS.maxManifestBytes)
    fail('KDNA_TOO_LARGE', 'Manifest is too large.');
  let manifest;
  try {
    manifest = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(manifestEntry.data));
  } catch {
    fail('KDNA_MANIFEST_INVALID', 'kdna.json is not valid UTF-8 JSON.');
  }
  if (!isObject(manifest)) fail('KDNA_MANIFEST_INVALID', 'kdna.json must be a JSON object.');

  const notices = [];
  const mimetype = mimeEntry ? new TextDecoder().decode(mimeEntry.data).trim() : null;
  if (mimetype !== KDNA_MIMETYPE) {
    notices.push({
      level: 'warn',
      text: `mimetype member is ${mimetype ?? 'missing'}, expected ${KDNA_MIMETYPE}.`,
    });
  }

  const payload = isObject(manifest.payload) ? manifest.payload : {};
  const encryption = isObject(manifest.encryption) ? manifest.encryption : null;
  const encryptedEntries = Array.isArray(encryption?.encrypted_entries)
    ? encryption.encrypted_entries
    : [];
  const encrypted = payload.encrypted === true || encryptedEntries.length > 0;
  const rep = isObject(manifest.representation_metadata) ? manifest.representation_metadata : {};
  const tuple = isObject(rep.tuple) ? rep.tuple : null;
  const catalog = Array.isArray(rep.catalog) ? rep.catalog.filter(isObject) : [];

  const payloadMembers = entries
    .filter((e) => e.name === 'payload.kdnab' || /^sections\/[^/]+\.kdnab$/.test(e.name))
    .map((e) => ({ name: e.name, size: e.size }));
  const tables = [];
  if (Array.isArray(payload.tables)) {
    for (const t of payload.tables.filter(isObject)) {
      const member = byName.get(t.member);
      let digest = 'unchecked';
      if (
        !encrypted &&
        member &&
        Number.isInteger(t.offset_bytes) &&
        Number.isInteger(t.length_bytes)
      ) {
        const slice = member.data.subarray(t.offset_bytes, t.offset_bytes + t.length_bytes);
        const hex = await sha256Hex(slice);
        if (hex === null) digest = 'unchecked';
        else
          digest =
            slice.length === t.length_bytes && `sha256:${hex}` === t.digest ? 'ok' : 'mismatch';
      } else if (!member) digest = 'member-missing';
      tables.push({
        section_id: t.section_id,
        table: t.table,
        member: t.member,
        rows: t.rows,
        digest,
      });
    }
  }
  if (tables.some((t) => t.digest === 'mismatch' || t.digest === 'member-missing')) {
    notices.push({
      level: 'error',
      text: 'One or more payload table digests do not match the manifest; do not trust this file.',
    });
  }

  let payloadStatus;
  if (encrypted) {
    payloadStatus = 'encrypted';
    notices.push({
      level: 'warn',
      text:
        'This asset’s payload is encrypted / password-protected (' +
        `${encryption?.profile ?? 'unknown profile'}). Its judgments cannot be read here; ` +
        'only the public manifest is shown. This page never asks for or uses a password or key.',
    });
  } else if (payloadMembers.length === 0) {
    payloadStatus = 'missing';
    notices.push({
      level: 'error',
      text: 'No payload member (payload.kdnab or sections/*.kdnab) is present.',
    });
  } else {
    payloadStatus = 'plain';
    notices.push({
      level: 'info',
      text: 'Payload frames are not decoded on this page; catalog and tuple come from the public manifest.',
    });
  }

  return {
    mimetype,
    entries: entries.map((e) => ({ name: e.name, size: e.size })),
    manifest,
    summary: {
      asset_id: manifest.asset_id ?? null,
      title: manifest.title ?? null,
      summary: manifest.summary ?? null,
      version: manifest.version ?? null,
      judgment_version: manifest.judgment_version ?? null,
      format_version: manifest.format_version ?? null,
      asset_type: manifest.asset_type ?? null,
      languages: Array.isArray(manifest.languages) ? manifest.languages : [],
      created_at: manifest.created_at ?? null,
      updated_at: manifest.updated_at ?? null,
    },
    tuple,
    catalog: catalog.map((c) => ({
      judgment_id: c.judgment_id,
      focus: c.focus,
      parent_ref: c.parent_ref ?? null,
    })),
    payload: {
      status: payloadStatus,
      encrypted,
      layout: payload.layout ?? (payload.path ? 'single' : null),
      encoding: payload.encoding ?? null,
      members: payloadMembers,
      tables,
    },
    encryption: encryption
      ? { profile: encryption.profile ?? null, profile_version: encryption.profile_version ?? null }
      : null,
    notices,
  };
}
