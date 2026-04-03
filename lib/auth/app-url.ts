export function getAppBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!raw) {
    throw new Error(
      "Brakuje NEXT_PUBLIC_APP_URL. Ustaw go w .env.local (dev) i w Vercel (prod)."
    );
  }

  return raw.replace(/\/$/, "");
}
