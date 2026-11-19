import { NextResponse, type NextRequest } from "next/server";
import { validateAuthCredentials } from "@/lib/auth-validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const passwordConfirmation = typeof body.passwordConfirmation === "string" ? body.passwordConfirmation : "";

  const validationError = validateAuthCredentials({ email, password, passwordConfirmation });
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Autenticazione non configurata sul server" }, { status: 503 });
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const msg = error.message.toLowerCase().includes("email not confirmed")
      ? "Devi prima confermare la tua email dal link ricevuto nella posta."
      : error.message.toLowerCase().includes("invalid login credentials")
        ? "Email o password non corretti."
        : error.message;
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
