import { LoginForm } from "@/app/login/login-form";

type LoginPageProps = {
  searchParams: Record<string, string | string[] | undefined>;
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

export default function LoginPage({ searchParams }: LoginPageProps) {
  const authError = firstString(searchParams.error);

  return <LoginForm authError={authError} />;
}
