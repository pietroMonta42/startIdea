import { NextResponse, type NextRequest } from "next/server";
import { validateAuthCredentials } from "@/lib/auth-validation";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { RoleBadge } from "@/lib/types";

const DUPLICATE_EMAIL_MSG = "Questa email è già registrata. Vai su Accedi per entrare.";
const VALID_ROLES: RoleBadge[] = ["tech_dev", "design", "marketing", "business", "other"];

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const passwordConfirmation = typeof body.passwordConfirmation === "string" ? body.passwordConfirmation : "";
  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
  const role = VALID_ROLES.includes(body.role as RoleBadge) ? (body.role as RoleBadge) : "tech_dev";
  const roleCustom = typeof body.role_custom === "string" ? body.role_custom.trim() : "";
  const university = typeof body.university === "string" ? body.university.trim() : "";

  const credError = validateAuthCredentials({
    email,
    password,
    passwordConfirmation,
    requireConfirmation: true,
  });
  if (credError) {
    return NextResponse.json({ error: credError }, { status: 400 });
  }
  if (fullName.length < 3) {
    return NextResponse.json({ error: "Inserisci il tuo nome e cognome" }, { status: 400 });
  }
  if (role === "other" && !roleCustom) {
    return NextResponse.json({ error: "Specifica il tuo ruolo" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Autenticazione non configurata sul server" }, { status: 503 });
  }

  // Controllo esplicito su auth.users (se service_role è configurata) per bloccare email duplicate
  // anche quando la conferma email è attiva.
  const admin = createSupabaseAdminClient();
  if (admin) {
    const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const exists = listed?.users?.some((u) => u.email?.toLowerCase() === email);
    if (exists) {
      return NextResponse.json({ error: DUPLICATE_EMAIL_MSG }, { status: 409 });
    }
  }

  const origin = request.nextUrl.origin;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/profilo&confirmed=1`,
      data: {
        full_name: fullName,
        role_badge: role,
        role_custom: role === "other" ? roleCustom : undefined,
        university,
      },
    },
  });

  if (error) {
    const lower = error.message.toLowerCase();
    if (lower.includes("already registered") || lower.includes("already exists")) {
      return NextResponse.json({ error: DUPLICATE_EMAIL_MSG }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Quando "Confirm email" è attivo e la prevenzione enumerazione è attiva in Supabase,
  // signUp su un'email già registrata restituisce user con identities = [].
  if (!data.user?.identities || data.user.identities.length === 0) {
    return NextResponse.json({ error: DUPLICATE_EMAIL_MSG }, { status: 409 });
  }

  return NextResponse.json({ ok: true, email });
}
