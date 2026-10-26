"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/session";

export type LoginState = { error?: string; username?: string };

const credentials = z.object({
  username: z.string().trim().toLowerCase().min(1),
  password: z.string().min(1),
});

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = credentials.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Renseignez votre identifiant et votre mot de passe." };
  }
  const { username, password } = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  const valid = user && (await bcrypt.compare(password, user.passwordHash));
  if (!valid) {
    return { error: "Identifiant ou mot de passe incorrect.", username };
  }

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
