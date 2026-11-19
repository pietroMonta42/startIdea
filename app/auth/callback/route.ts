import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const confirmed = requestUrl.searchParams.get("confirmed") === "1";
  const next = requestUrl.searchParams.get("next") ?? "/profilo";
  const origin = requestUrl.origin;

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    let authError: string | null = null;
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) authError = error.message;
    } else if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
      if (error) authError = error.message;
    }

    if (authError) {
      return NextResponse.redirect(
        `${origin}/profilo?auth_error=${encodeURIComponent(authError)}`
      );
    }

    // Dopo la conferma email della registrazione, porta l'utente alla pagina Accedi
    // con il banner di conferma.
    if (confirmed) {
      await supabase.auth.signOut({ scope: "local" });
      return NextResponse.redirect(`${origin}/profilo?confirmed=1`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
