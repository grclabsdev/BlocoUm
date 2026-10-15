import Link from "next/link";
import {
  DollarSign,
  AlertCircle,
  TrendingUp,
  Megaphone,
  CalendarCheck2,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { formatMoeda, formatPercentual, formatDataHora, formatData } from "@/lib/formatters";
import { obterDadosDashboard } from "@/server/actions/dashboard";
import { EvolucaoFinanceiraChart } from "./evolucao-financeira-chart";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ condominioId: string }>;
}) {
  const resolvedParams = await params;
  const condominioId = resolvedParams.condominioId;

  const res = await obterDadosDashboard(condominioId);

  if (!res.success || !res.data) {
    return <ErrorState message={res.error || "Erro ao carregar dados do dashboard."} />;
  }

  const {
    saldoAtual,
    totalReceitas,
    totalDespesas,
    inadimplenciaPct,
    totalEsperado,
    totalAtrasado,
    totalPago,
    grafico6Meses,
    ultimosComunicados,
    proximasReservas,
    papel,
    minhaCobrancaMes,
  } = res.data;

  return (
    <div className="space-y-6">
      <PageHeader
        heading="Visão Geral do Condomínio"
        subheading="Acompanhe os principais indicadores financeiros, avisos e eventos."
      >
        <Button asChild size="sm" variant="outline" className="gap-1.5">
          <Link href={`/${condominioId}/lancamentos`}>
            Ver Lançamentos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </PageHeader>

      {/* Se morador tiver cobrança do mês, destaca card prioritário */}
      {papel === "MORADOR" && minhaCobrancaMes && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">
                  Taxa Condominial do Mês Atual
                </p>
                <p className="text-xs text-muted-foreground">
                  Vencimento em {formatData(minhaCobrancaMes.vencimento)} · Valor:{" "}
                  <strong>{formatMoeda(minhaCobrancaMes.valorAtual)}</strong>
                </p>
              </div>
            </div>
            <div>
              <Badge
                variant={
                  minhaCobrancaMes.status === "PAGO"
                    ? "success"
                    : minhaCobrancaMes.status === "ATRASADO"
                    ? "destructive"
                    : "warning"
                }
              >
                {minhaCobrancaMes.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Atual */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              Saldo em Caixa
              <DollarSign className="h-4 w-4 text-primary" />
            </CardDescription>
            <CardTitle
              className={`text-2xl font-bold ${
                saldoAtual >= 0 ? "text-emerald-600" : "text-destructive"
              }`}
            >
              {formatMoeda(saldoAtual)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex justify-between">
            <span>Receitas: {formatMoeda(totalReceitas)}</span>
            <span>Despesas: {formatMoeda(totalDespesas)}</span>
          </CardContent>
        </Card>

        {/* Inadimplência */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              Inadimplência (Mês Atual)
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatPercentual(inadimplenciaPct)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {formatMoeda(totalAtrasado)} em atraso de {formatMoeda(totalEsperado)}
          </CardContent>
        </Card>

        {/* Recebido no Mês */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              Arrecadado no Mês
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600">
              {formatMoeda(totalPago)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Cobranças com baixa confirmada
          </CardContent>
        </Card>

        {/* Reservas e Eventos */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              Próximos Eventos
              <CalendarCheck2 className="h-4 w-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold">{proximasReservas.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Reservas confirmadas nos próximos dias
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Receita x Despesa (Últimos 6 meses) — Client Component isolado */}
      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Evolução Financeira: Receitas vs Despesas (Últimos 6 meses)
          </CardTitle>
          <CardDescription>
            Comparativo mês a mês dos valores arrecadados e gastos do condomínio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EvolucaoFinanceiraChart data={grafico6Meses} />
        </CardContent>
      </Card>

      {/* Grid: Últimos Comunicados e Próximas Reservas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimos Comunicados */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-primary" />
                Mural de Avisos Recentes
              </CardTitle>
              <CardDescription>Últimas publicações da administração</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link href={`/${condominioId}/comunicados`}>Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {ultimosComunicados.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                Nenhum comunicado recente publicado.
              </p>
            ) : (
              ultimosComunicados.map((c: any) => (
                <div
                  key={c.id}
                  className="rounded-lg border p-3 bg-card hover:bg-muted/30 transition space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-foreground truncate">{c.titulo}</p>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {formatData(c.publicadoEm)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{c.corpo}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Próximas Reservas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarCheck2 className="h-4 w-4 text-primary" />
                Próximas Reservas de Áreas Comuns
              </CardTitle>
              <CardDescription>Espaços agendados pelos moradores</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link href={`/${condominioId}/reservas`}>Ver agenda</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {proximasReservas.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                Nenhum espaço reservado para os próximos dias.
              </p>
            ) : (
              proximasReservas.map((r: any) => (
                <div
                  key={r.id}
                  className="rounded-lg border p-3 bg-card hover:bg-muted/30 transition flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {r.areaComum.nome}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Unidade {r.unidade.identificador} · {formatDataHora(r.inicio)}
                    </p>
                  </div>
                  <Badge variant="success" className="text-[10px] shrink-0">
                    Confirmada
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
