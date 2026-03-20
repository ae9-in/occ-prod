import crypto from "crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { User } from "@prisma/client";
import { env } from "../config/env";
import type { JwtAccessPayload, JwtRefreshPayload } from "../types/auth";

function parseDurationToMs(duration: string) {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unit = match[2];
  const map: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };
  return value * map[unit];
}

export function signAccessToken(user: Pick<User, "id" | "role" | "email">) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresIn as SignOptions["expiresIn"]
  } as SignOptions);
}

export function signRefreshToken(user: Pick<User, "id" | "role">) {
  return jwt.sign({ sub: user.id, role: user.role, tokenId: crypto.randomUUID() }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn as SignOptions["expiresIn"]
  } as SignOptions);
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.jwtAccessSecret) as JwtAccessPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.jwtRefreshSecret) as JwtRefreshPayload;
}

export function getRefreshExpiryDate() {
  return new Date(Date.now() + parseDurationToMs(env.jwtRefreshExpiresIn));
}

export function hashStoredToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
