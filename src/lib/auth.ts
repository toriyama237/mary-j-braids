import "server-only";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession } from "./session";

export type CurrentUser = { id: number; name: string };

// Couche d'accès aux données : toute page ou action protégée passe par ici.
// `cache` évite de relire la session plusieurs fois pendant un même rendu.
export const requireUser = cache(async (): Promise<CurrentUser> => {
  const { userId } = await getSession();
  if (!userId) redirect("/login");

  const [user] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) redirect("/login");

  return user;
});
