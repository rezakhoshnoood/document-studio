/* features/encryption.js — رمزنگاری AES-GCM + PBKDF2 (Web Crypto API) */
const ITERATIONS = 180000;
const enc = new TextEncoder();
const dec = new TextDecoder();

export const bufToB64 = (buf) => {
  const bytes = new Uint8Array(buf);
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
};
export const b64ToBuf = (b64) => {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
};

async function deriveKey(password, salt) {
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/** رمزنگاری هر داده قابل JSON — خروجی: { v, iter, salt, iv, data } به‌صورت base64 */
export async function encryptJSON(obj, password) {
  if (!password) throw new Error('password required');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const plaintext = enc.encode(JSON.stringify(obj));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  return {
    v: 1,
    alg: 'AES-GCM/PBKDF2-SHA256',
    iter: ITERATIONS,
    salt: bufToB64(salt),
    iv: bufToB64(iv),
    data: bufToB64(ct)
  };
}

/** رمزگشایی — در صورت رمز اشتباه، خطا پرتاب می‌کند */
export async function decryptJSON(payload, password) {
  if (!payload || !payload.data) throw new Error('invalid payload');
  const salt = new Uint8Array(b64ToBuf(payload.salt));
  const iv = new Uint8Array(b64ToBuf(payload.iv));
  const key = await deriveKey(password, salt);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, b64ToBuf(payload.data));
  return JSON.parse(dec.decode(pt));
}

/** هش ساده برای تشخیص صحت رمز در رابط کاربری (اختیاری) */
export async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return bufToB64(buf);
}

export const isCryptoAvailable = () => !!(globalThis.crypto && crypto.subtle);

export default { encryptJSON, decryptJSON, bufToB64, b64ToBuf, sha256, isCryptoAvailable };
