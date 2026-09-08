import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-center text-lg font-semibold text-slate-900">
          Taller de Maletas
        </h1>
        <p className="mb-5 text-center text-sm text-slate-500">
          Ingresa la clave del taller para continuar.
        </p>
        <LoginForm next={next ?? "/"} />
      </div>
    </div>
  );
}
