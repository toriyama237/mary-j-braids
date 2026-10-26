import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session-cookie";

// Vérification optimiste : sans cookie de session, on renvoie vers /login.
// La vraie vérification (cookie déchiffré + utilisateur en base) se fait
// côté serveur dans requireUser().
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const isLogin = request.nextUrl.pathname === "/login";

  if (!hasSession && !isLogin) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Fichiers publics lus avant la connexion (icônes, manifest d'installation).
  matcher: ["/((?!_next/static|_next/image|icon.svg|apple-icon.png|icons/|manifest.webmanifest).*)"],
};
