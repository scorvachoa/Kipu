import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getOptionalUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <LoginForm />
    </main>
  );
}