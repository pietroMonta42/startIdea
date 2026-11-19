export function validateAuthCredentials(params: {
  email: string;
  password: string;
  passwordConfirmation: string;
}): string | null {
  const email = params.email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Inserisci una mail valida";
  }
  if (params.password.length < 6) {
    return "La password deve avere almeno 6 caratteri";
  }
  if (params.password !== params.passwordConfirmation) {
    return "Le password non coincidono";
  }
  return null;
}
