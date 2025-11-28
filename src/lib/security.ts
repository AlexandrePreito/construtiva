"use client";

export async function hashPassword(valor: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(valor);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

