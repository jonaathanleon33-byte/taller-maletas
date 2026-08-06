import { AppHeader } from "@/components/AppHeader";
import { NuevaOrdenForm } from "@/components/NuevaOrdenForm";

export default function NuevaOrdenPage() {
  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Nueva orden" backHref="/" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-4">
        <NuevaOrdenForm />
      </main>
    </div>
  );
}
