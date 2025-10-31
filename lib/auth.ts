import bcrypt from "bcryptjs";

import { prisma } from "./prisma";
import { createSession, destroySession, getSession } from "./session";

export async function signIn(email: string, password: string) {
  const user = await prisma.user.findFirst({ where: { email, isActive: true } });
  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  await createSession(user.id);
  return user;
}

export async function signOut() {
  await destroySession();
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}
