/**
 * Utilities for encoding and decoding travel plans and local guides in URL hashes
 * so that shared links carry the full content without requiring a database.
 */

export function encodeShareData(data: unknown): string {
  try {
    const json = JSON.stringify(data);
    // Standard UTF-8 to base64 encoding
    const encoded = btoa(
      encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16)),
      ),
    );
    // URL-safe replacement
    return encodeURIComponent(encoded);
  } catch (err) {
    console.error('Failed to encode share data:', err);
    return '';
  }
}

export function decodeShareData<T>(hashString: string): T | null {
  try {
    if (!hashString) return null;
    const raw = decodeURIComponent(hashString);
    const decodedJson = decodeURIComponent(
      atob(raw)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(decodedJson) as T;
  } catch (err) {
    console.warn('Failed to decode share data from URL:', err);
    return null;
  }
}
