import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

interface SharePayload {
  type: 'plan' | 'local';
  destination?: string;
  location?: string;
  data: unknown;
  createdAt: string;
}

const memoryStore = new Map<string, SharePayload>();
const STORAGE_FILE = path.join(os.tmpdir(), 'journeyai_shares_cache.json');
const LEGACY_STORAGE_FILE = path.join(process.cwd(), '.next', 'shares_cache.json');

function initCache() {
  try {
    const fileToRead = fs.existsSync(STORAGE_FILE)
      ? STORAGE_FILE
      : fs.existsSync(LEGACY_STORAGE_FILE)
        ? LEGACY_STORAGE_FILE
        : null;

    if (fileToRead) {
      const content = fs.readFileSync(fileToRead, 'utf-8');
      const parsed = JSON.parse(content) as Record<string, SharePayload>;
      for (const [k, v] of Object.entries(parsed)) {
        memoryStore.set(k, v);
      }
    }
  } catch (err) {
    console.warn('Could not read shares cache file:', err);
  }
}

function persistCache() {
  try {
    const obj: Record<string, SharePayload> = {};
    for (const [k, v] of memoryStore.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(obj));
  } catch (err) {
    console.warn('Could not persist shares cache file:', err);
  }
}

// Load on module startup
initCache();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // 8-character compact unique id
    const id = crypto.randomBytes(4).toString('hex');

    const entry: SharePayload = {
      type: body.type || 'plan',
      destination: body.destination,
      location: body.location,
      data: body.data,
      createdAt: new Date().toISOString(),
    };

    memoryStore.set(id, entry);
    persistCache();

    return NextResponse.json({ success: true, id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to save share';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Share ID required' }, { status: 400 });
    }

    const entry = memoryStore.get(id);
    if (!entry) {
      return NextResponse.json({ error: 'Share link not found or expired' }, { status: 404 });
    }

    return NextResponse.json(entry);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve share';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
