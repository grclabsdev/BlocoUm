import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { obterConfiguracoes } from "@/server/actions/configuracoes";
import { ConfiguracoesTabs } from "./configuracoes-tabs";

export default async function ConfiguracoesPage({
  params,
}: {
  params: Promise<{ condominioId: string }>;
}) {
  const resolvedParams = await params;
  const condominioId = resolvedParams.condominioId;

  const res = await obterConfiguracoes(condominioId);

  if (!res.success || !res.data) {
    return <ErrorState message={res.error || "Erro ao carregar configurações."} />;
  }

  const { condominio, memberships, papelUsuarioLogado } = res.data;

  return (
    <div className="space-y-6">
      <PageHeader
        heading="Configurações do Condomínio"
        subheading="Dados cadastrais, parâmetros financeiros e gestão de papéis e acessos."
      />

      <ConfiguracoesTabs
        condominioId={condominioId}
        condominio={condominio}
        memberships={memberships}
        papelUsuarioLogado={papelUsuarioLogado}
      />
    </div>
  );
}
