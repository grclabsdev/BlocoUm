import Link from "next/link";
import {
  Receipt,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { formatMoeda, formatData, formatPercentual } from "@/lib/formatters";
import { listarFinanceiro } from "@/server/actions/financeiro";
import type { Lancamento, LancamentoCategoria } from "@/lib/db/prisma";
import { GerarRateioDialog } from "./gerar-rateio-dialog";
import { PrestacaoContasDialog } from "./prestacao-contas-dialog";
import { CobrancasTable, type CobrancaItem } from "./cobrancas-table";

type LancamentoComCategoria = Lancamento & {
  categoria: LancamentoCategoria;
};

export default async function LancamentosPage({
  params,
}: {
  params: Promise<{ condominioId: string }>;
}) {
  const resolvedParams = await params;
  const condominioId = resolvedParams.condominioId;

  const res = await listarFinanceiro(condominioId);

  if (!res.success || !res.data) {
    return <ErrorState message={res.error || "Erro ao carregar dados financeiros."} />;
  }

  const { cobrancas, lancamentos, resumo, papel } = res.data;
  const isSindico = ["SINDICO", "SUBSINDICO"].includes(papel);

  // Serializa as cobranças em Plain Old JavaScript Objects (POJO) para o Client Component
  // Evita o erro "Only plain objects can be passed to Client Component" causado por Decimals do Prisma
  const cobrancasSerializadas: CobrancaItem[] = cobrancas.map((c) => ({
    id: c.id,
    competencia: c.competencia,
    vencimento: c.vencimento,
    valorOriginal: Number(c.valorOriginal),
    valorAtual: Number(c.valorAtual),
    status: c.status,
    pagoEm: c.pagoEm,
    unidade: {
      identificador: c.unidade.identificador,
      bloco: c.unidade.bloco ? { nome: c.unidade.bloco.nome } : null,
    },
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        heading="Gestão Financeira"
        subheading="Cobranças condominiais, lançamentos contábeis, rateio e prestação de contas."
      >
        <div className="flex items-center gap-2 flex-wrap">
          {isSindico && (
            <Button asChild size="sm" className="gap-1.5 shadow-xs">
              <Link href={`/${condominioId}/lancamentos/novo`}>
                <PlusCircle className="h-4 w-4" />
                Novo Lançamento
              </Link>
            </Button>
          )}

          {isSindico && <GerarRateioDialog condominioId={condominioId} />}

          <PrestacaoContasDialog condominioId={condominioId} />
        </div>
      </PageHeader>

      {/* Cards de Métricas Financeiras */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              Esperado no Mês
              <DollarSign className="h-4 w-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-2xl">{formatMoeda(resumo.totalEsperadoMes)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Soma das cobranças emitidas
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              Recebido no Mês
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </CardDescription>
            <CardTitle className="text-2xl text-emerald-600">
              {formatMoeda(resumo.totalRecebidoMes)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Cobranças com baixa confirmada
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              Em Atraso
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardDescription>
            <CardTitle className="text-2xl text-destructive">
              {formatMoeda(resumo.totalAtrasado)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Com multa (2%) e juros (1% a.m.)
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              Taxa de Inadimplência
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </CardDescription>
            <CardTitle className="text-2xl text-amber-600 dark:text-amber-400">
              {formatPercentual(resumo.inadimplenciaPct)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Proporção de atraso da competência
          </CardContent>
        </Card>
      </div>

      {/* Tabs Principais */}
      <Tabs defaultValue="cobrancas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cobrancas">
            Cobranças {papel === "MORADOR" ? "da Minha Unidade" : "Gerais"} ({cobrancas.length})
          </TabsTrigger>
          {isSindico && (
            <TabsTrigger value="lancamentos">
              Lançamentos Contábeis ({lancamentos.length})
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab 1: Cobranças */}
        <TabsContent value="cobrancas">
          {cobrancas.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="Nenhuma cobrança encontrada"
              description="Gere o rateio do mês para emitir as cobranças de taxa condominial para as unidades."
            />
          ) : (
            <Card>
              <CobrancasTable
                cobrancas={cobrancasSerializadas}
                isSindico={isSindico}
                condominioId={condominioId}
              />
            </Card>
          )}
        </TabsContent>

        {/* Tab 2: Lançamentos */}
        {isSindico && (
          <TabsContent value="lancamentos">
            {lancamentos.length === 0 ? (
              <EmptyState
                icon={PlusCircle}
                title="Nenhum lançamento registrado"
                description="Registre receitas e despesas para manter o caixa do condomínio atualizado."
                actionLabel="Novo lançamento"
                actionHref={`/${condominioId}/lancamentos/novo`}
              />
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(lancamentos as LancamentoComCategoria[]).map((l: LancamentoComCategoria) => {
                      const isReceita = l.tipo === "RECEITA";
                      return (
                        <TableRow key={l.id}>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatData(l.data)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={isReceita ? "success" : "destructive"}
                              className="text-xs"
                            >
                              {l.tipo}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-foreground">
                            {l.categoria.nome}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{l.descricao}</TableCell>
                          <TableCell
                            className={`text-right font-bold ${
                              isReceita ? "text-emerald-600" : "text-destructive"
                            }`}
                          >
                            {isReceita ? "+" : "-"} {formatMoeda(l.valor)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
