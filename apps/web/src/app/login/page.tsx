import Link from "next/link";
import { AuthForm } from "./auth-form";
import { login } from "./actions";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-2xl font-semibold">Log in</h1>
      <AuthForm action={login} submitLabel="Log in" />
      <p className="mt-4 text-sm text-neutral-500">
        No account? <Link href="/signup" className="underline">Sign up</Link>
      </p>
    </main>
  );
}
