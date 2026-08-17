import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/auth";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  const user = await getOptionalUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthShell>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
