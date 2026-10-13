import { AppHeader } from "@/components/AppHeader";
import { DomicilioForm } from "@/components/DomicilioForm";

export default function NuevoDomicilioPage() {
  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Nuevo domicilio" backHref="/domicilios" />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-4 pb-10">
        <DomicilioForm interno />
      </main>
    </div>
  );
}
