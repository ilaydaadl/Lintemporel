import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/server-clients";

// Appelée par l'espace admin après une modification, pour que la boutique
// affiche tout de suite le catalogue à jour. Réservée aux admins.
export async function POST(req: Request) {
  const supabase = getServiceSupabase();
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!supabase || !token) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data: userData } = await supabase.auth.getUser(token);
  const userId = userData.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { data: admin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  revalidateTag("products", { expire: 0 });
  return NextResponse.json({ ok: true });
}
