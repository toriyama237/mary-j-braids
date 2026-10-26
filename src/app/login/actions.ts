"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { clearFailures, lockedFor, recordFailure } from "@/lib/login-throttle";
import { getSession } from "@/lib/session";

/** `retryAfter` : secondes d'attente quand l'identifiant est bloqué. */
export type LoginState = { error?: string; username?: string; retryAfter?: number };

const credentials = z.object({
  username: z.string().trim().toLowerCase().min(1).max(50),
  password: z.string().min(1),
});

const LOCKED = "Trop de tentatives. Patientez avant de réessayer.";

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = credentials.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Renseignez votre identifiant et votre mot de passe." };
  }
  const { username, password } = parsed.data;

  // Blocage par identifiant, que le compte existe ou non (on ne révèle pas lesquels existent).
  const wait = await lockedFor(username);
  if (wait > 0) return { error: LOCKED, username, retryAfter: wait };

  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  const valid = user && (await bcrypt.compare(password, user.passwordHash));
  if (!valid) {
    const { lockedFor: lock, remaining } = await recordFailure(username);
    if (lock > 0) return { error: LOCKED, username, retryAfter: lock };
    const warning =
      remaining <= 2
        ? ` Encore ${remaining} essai${remaining > 1 ? "s" : ""} avant un blocage d'une minute.`
        : "";
    return { error: `Identifiant ou mot de passe incorrect.${warning}`, username };
  }

  await clearFailures(username);
  const session = await getSession();
  session.userId = user.id;
  await session.save();
  redirect("/");
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}
