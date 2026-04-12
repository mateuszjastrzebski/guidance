"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DevBypassResult = { error: string } | { ok: true };

/**
 * Logowanie hasłem wyłącznie na lokalny dev — w produkcji zawsze odrzucone.
 * W Supabase: włącz Email + hasło, utwórz użytkownika z hasłem (Dashboard → Users).
 */
export async function devBypassLogin(): Promise<DevBypassResult> {
  if (process.env.NODE_ENV !== "development") {
    return { error: "Dostępne tylko w trybie development." };
  }

  const email = process.env.DEV_TEST_EMAIL?.trim();
  const password = process.env.DEV_TEST_PASSWORD;

  if (!email || !password) {
    return {
      error:
        "Ustaw DEV_TEST_EMAIL i DEV_TEST_PASSWORD w .env.local (patrz .env.example)."
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      error: `${error.message} — sprawdź, czy w Supabase włączone jest logowanie hasłem i czy użytkownik istnieje.`
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
