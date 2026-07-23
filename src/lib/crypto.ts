import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Eenvoudige AES-256-GCM versleuteling voor gevoelige velden (bv. Gmail refresh
 * token). De sleutel wordt afgeleid van AUTH_SECRET.
 */
function key(): Buffer {
  const secret = process.env.AUTH_SECRET ?? "woningwaker-dev-secret";
  return createHash("sha256").update(secret).digest();
}

export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${enc.toString("base64url")}`;
}

export function decrypt(payload: string): string | null {
  try {
    const [ivB, tagB, encB] = payload.split(".");
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivB, "base64url"));
    decipher.setAuthTag(Buffer.from(tagB, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(encB, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
