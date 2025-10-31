import crypto from "crypto";
import { addDays } from "date-fns";
import { cookies } from "next/headers";

import { prisma } from "./prisma";

const SESSION_COOKIE_NAME = "session-token";
const SESSION_DURATION_DAYS = 7;

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set");
}

function hashToken(raw: string) {
  return crypto.createHmac("sha256", sessionSecret).update(raw).digest("hex");
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const hashed = hashToken(token);
  const expiresAt = addDays(new Date(), SESSION_DURATION_DAYS);
  const cookieStore = await cookies();

  await prisma.session.create({
    data: {
      token: hashed,
      expiresAt,
      userId,
    },
  });

  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    expires: expiresAt,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return;

  const hashed = hashToken(token);
  await prisma.session.deleteMany({ where: { token: hashed } });
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("Session is required");
  }
  return session;
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const hashed = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { token: hashed },
    include: {
      user: true,
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  return session;
}
