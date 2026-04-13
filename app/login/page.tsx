import { LoginForm } from "@/app/login/login-form";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstString(
  value: string | string[] | undefined
): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && value[0]) {
    return value[0];
  }
  return undefined;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const sp = await searchParams;
  const authError = firstString(sp.error);

  return <LoginForm authError={authError} />;
}
