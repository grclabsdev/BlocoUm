import { Home, Percent, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { listarEstrutural } from "@/server/actions/estrutural";
import { NovoBlocoDialog } from "./novo-bloco-dialog";
import { NovaUnidadeDialog } from "./nova-unidade-dialog";
import { ConvidarMoradorDialog } from "./convidar-morador-dialog";
import { MoradoresTabs } from "./moradores-tabs";

export default async function MoradoresPage({
  params,
}: {
  params: Promise<{ condominioId: string }>;
}) {
  const resolvedParams = await params;
  const condominioId = resolvedParams.condominioId;

  const res = await listarEstrutural(condominioId);

  if (!res.success || !res.data) {
    return <ErrorState message={res.error || "Erro ao carregar dados estruturais."} />;
  }

  const { blocos, unidades, perfis, convites, somaFracaoTotal } = res.data;

  return (
    <div className="space-y-6">
      <PageHeader
        heading="Estrutura e Moradores"
        subheading="Gerencie blocos, unidades com fração ideal e convites de moradores."
      >
        <div className="flex items-center gap-2 flex-wrap">
          <NovoBlocoDialog condominioId={condominioId} />
          <NovaUnidadeDialog
            condominioId={condominioId}
            blocos={blocos}
            somaFracaoTotal={somaFracaoTotal}
          />
          <ConvidarMoradorDialog
            condominioId={condominioId}
            unidades={unidades}
          />
        </div>
      </PageHeader>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              Total de Unidades
              <Home className="h-4 w-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-2xl">{unidades.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Distribuídas em {blocos.length} blocos
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              Soma das Frações Ideais
              <Percent className="h-4 w-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              {somaFracaoTotal.toFixed(2)}%
              {Math.abs(somaFracaoTotal - 100) < 0.01 ? (
                <Badge variant="success" className="text-[10px]">
                  100% OK
                </Badge>
              ) : (
                <Badge variant="warning" className="text-[10px]">
                  Incompleto
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Base para cálculo do rateio condominial
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              Moradores Registrados
              <Users className="h-4 w-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-2xl">{perfis.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {convites.filter((c: any) => c.status === "PENDENTE").length} convite(s) pendente(s)
          </CardContent>
        </Card>
      </div>

      {/* Abas e Tabelas (Client Component) */}
      <MoradoresTabs
        unidades={unidades}
        blocos={blocos}
        perfis={perfis}
        convites={convites}
      />
    </div>
  );
}
