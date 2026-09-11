const encoder = new TextEncoder();

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function createSessionToken(secret: string) {
  const payload = {
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7
  };
  const payloadText = JSON.stringify(payload);
  const payloadEncoded = bytesToBase64Url(encoder.encode(payloadText));
  const signature = await hmac(payloadEncoded, secret);
  return `${payloadEncoded}.${signature}`;
}

export async function verifySessionToken(token: string | undefined, secret: string | undefined) {
  if (!token || !secret) return false;
  const [payloadEncoded, providedSignature] = token.split(".");
  if (!payloadEncoded || !providedSignature) return false;
  const expectedSignature = await hmac(payloadEncoded, secret);
  if (providedSignature !== expectedSignature) return false;

  try {
    const payloadBytes = base64UrlToBytes(payloadEncoded);
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as { exp?: number };
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}
