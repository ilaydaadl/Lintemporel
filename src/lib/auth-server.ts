// À n'importer QUE côté serveur : identifier l'utilisatrice d'une requête.
import { getServiceSupabase } from "./server-clients";

/** Utilisatrice connectée (jeton « Bearer » envoyé par le navigateur), ou null. */
export async function getRequestUser(req: Request) {
  const supabase = getServiceSupabase();
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!supabase || !token) return null;
  const { data } = await supabase.auth.getUser(token);
  return data.user ? { id: data.user.id, email: data.user.email ?? null } : null;
}

/** L'utilisatrice est-elle admin (table admins) ? */
export async function isAdminUser(userId: string) {
  const supabase = getServiceSupabase();
  if (!supabase) return false;
  const { data } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}
