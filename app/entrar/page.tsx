import { Suspense } from "react";
import EntrarForm from "./EntrarForm";

export default function EntrarPage() {
  return (
    <Suspense fallback={<main className="p-8 text-sm">Carregando…</main>}>
      <EntrarForm />
    </Suspense>
  );
}
