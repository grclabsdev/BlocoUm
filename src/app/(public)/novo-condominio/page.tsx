import { getServerSession } from "@/lib/auth/session";
import { NovoCondominioWizard } from "./novo-condominio-wizard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Criar Novo Condomínio",
  description:
    "Cadastre seu condomínio residencial, configure blocos e unidades e convide moradores com 60 dias de teste gratuito.",
};

export default async function NovoCondominioPage() {
  const session = await getServerSession();

  return (
    <div className="flex min-h-screen items-center justify-center bg-radial from-muted/60 to-background p-4 sm:p-8">
      <NovoCondominioWizard initialUser={session?.user} />
    </div>
  );
}

