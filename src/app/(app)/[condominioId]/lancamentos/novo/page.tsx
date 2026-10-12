import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { listarFinanceiro } from "@/server/actions/financeiro";
import { NovoLancamentoForm } from "./novo-lancamento-form";

export default async function NovoLancamentoPage({
  params,
}: {
  params: Promise<{ condominioId: string }>;
}) {
  const resolvedParams = await params;
  const condominioId = resolvedParams.condominioId;

  const res = await listarFinanceiro(condominioId);

  if (!res.success || !res.data) {
    return <ErrorState message={res.error || "Erro ao carregar dados."} />;
  }

  const categorias = res.data.categorias;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground">
          <Link href={`/${condominioId}/lancamentos`}>
            <ArrowLeft className="h-4 w-4" />
            Voltar para lançamentos
          </Link>
        </Button>
      </div>

      <NovoLancamentoForm
        condominioId={condominioId}
        categorias={categorias}
      />
    </div>
  );
}
