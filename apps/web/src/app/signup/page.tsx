import Link from "next/link";
import { AuthForm } from "../login/auth-form";
import { signup } from "./actions";

export default function SignupPage() {
  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-2xl font-semibold">Create an account</h1>
      <AuthForm action={signup} submitLabel="Sign up" withName />
      <p className="mt-4 text-sm text-neutral-500">
        Already have an account? <Link href="/login" className="underline">Log in</Link>
      </p>
    </main>
  );
}
