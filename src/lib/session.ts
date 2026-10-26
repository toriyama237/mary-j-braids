import "server-only";
import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./session-cookie";

export type SessionData = { userId?: number };

const sessionOptions: SessionOptions = {
  cookieName: SESSION_COOKIE,
  password: process.env.SESSION_PASSWORD!,
  ttl: 60 * 60 * 24 * 7, // 7 jours
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
