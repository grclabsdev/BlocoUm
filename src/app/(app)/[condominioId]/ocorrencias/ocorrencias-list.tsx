"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  MessageSquare,
  Clock,
  CheckCircle2,
  PlayCircle,
  Send,
  Building,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDataHora } from "@/lib/formatters";
import { adicionarComentarioOcorrencia } from "@/server/actions/ocorrencias";
import { AlterarStatusDialog } from "./alterar-status-dialog";

export function OcorrenciasList({
  ocorrencias,
  papel,
  condominioId,
  onNovaOcorrencia,
}: {
  ocorrencias: any[];
  papel: string;
  condominioId: string;
  onNovaOcorrencia?: () => void;
}) {
  const podeGerenciarStatus = ["SINDICO", "SUBSINDICO", "FUNCIONARIO"].includes(papel);

  // Estados do modal de status
  const [modalStatusAberto, setModalStatusAberto] = useState(false);
  const [ocorrenciaSelecionada, setOcorrenciaSelecionada] = useState<any>(null);
  const [novoStatus, setNovoStatus] = useState<any>("");

  // Comentários
  const [textoComentario, setTextoComentario] = useState<{ [key: string]: string }>({});
  const [isPendingComentario, startTransition] = useTransition();

  function abrirModalStatus(oc: any, status: any) {
    setOcorrenciaSelecionada(oc);
    setNovoStatus(status);
    setModalStatusAberto(true);
  }

  function handleEnviarComentario(ocorrenciaId: string) {
    const texto = textoComentario[ocorrenciaId]?.trim();
    if (!texto) return;

    startTransition(async () => {
      const res = await adicionarComentarioOcorrencia(condominioId, {
        ocorrenciaId,
        texto,
      });
      if (!res.success) {
        toast.error(res.error || "Erro ao adicionar comentário.");
      } else {
        toast.success("Comentário adicionado!");
        setTextoComentario((prev) => ({ ...prev, [ocorrenciaId]: "" }));
      }
    });
  }

  if (ocorrencias.length === 0) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Nenhuma ocorrência registrada"
        description="Nenhum problema pendente ou chamado foi aberto até o momento."
        actionLabel="Abrir primeira ocorrência"
        onAction={onNovaOcorrencia}
      />
    );
  }

  return (
    <>
      <AlterarStatusDialog
        condominioId={condominioId}
        ocorrencia={ocorrenciaSelecionada}
        novoStatus={novoStatus}
        aberto={modalStatusAberto}
        onOpenChange={setModalStatusAberto}
      />

      <div className="space-y-5">
        {ocorrencias.map((oc: any) => {
          const isAberta = oc.status === "ABERTA";
          const isEmAndamento = oc.status === "EM_ANDAMENTO";
          const isResolvida = oc.status === "RESOLVIDA";
          const isCancelada = oc.status === "CANCELADA";

          return (
            <Card key={oc.id} className="overflow-hidden border-border/80 shadow-xs">
              <CardHeader className="pb-3 bg-muted/10">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={
                          isResolvida
                            ? "success"
                            : isCancelada
                            ? "destructive"
                            : isEmAndamento
                            ? "warning"
                            : "default"
                        }
                        className="text-xs font-semibold"
                      >
                        {oc.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {oc.categoria}
                      </Badge>
                      {oc.unidade && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {oc.unidade.identificador}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDataHora(oc.createdAt)}
                      </span>
                    </div>
                    <CardTitle className="text-lg font-bold text-foreground pt-1">
                      {oc.titulo}
                    </CardTitle>
                  </div>

                  {/* Ações de Transição de Status Guiadas */}
                  {podeGerenciarStatus && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Se ABERTA: Pode ir para EM_ANDAMENTO ou CANCELADA. NUNCA direto para RESOLVIDA */}
                      {isAberta && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => abrirModalStatus(oc, "EM_ANDAMENTO")}
                            className="h-8 gap-1 text-xs text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                          >
                            <PlayCircle className="h-3.5 w-3.5" />
                            Iniciar Atendimento
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => abrirModalStatus(oc, "CANCELADA")}
                            className="h-8 text-xs text-destructive hover:bg-destructive/10"
                          >
                            Cancelar
                          </Button>
                        </>
                      )}

                      {/* Se EM_ANDAMENTO: Pode ir para RESOLVIDA ou CANCELADA */}
                      {isEmAndamento && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => abrirModalStatus(oc, "RESOLVIDA")}
                            className="h-8 gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Marcar como Resolvida
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => abrirModalStatus(oc, "CANCELADA")}
                            className="h-8 text-xs text-destructive hover:bg-destructive/10"
                          >
                            Cancelar
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                <p className="text-sm text-foreground/90 whitespace-pre-line">
                  {oc.descricao}
                </p>

                {/* Thread de Comentários / Histórico */}
                <div className="space-y-3 pt-2 border-t">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Histórico e Comentários ({oc.comentarios.length}):
                  </p>

                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {oc.comentarios.map((com: any) => (
                      <div
                        key={com.id}
                        className="rounded-lg bg-muted/40 p-2.5 text-xs space-y-1 border"
                      >
                        <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                          <span className="font-semibold text-foreground">
                            {com.autorId === oc.criadoPor
                              ? "Autor do Chamado"
                              : "Gestão / Portaria"}
                          </span>
                          <span>{formatDataHora(com.createdAt)}</span>
                        </div>
                        <p className="text-foreground/90">{com.texto}</p>
                      </div>
                    ))}
                  </div>

                  {/* Caixa para adicionar comentário */}
                  {!isCancelada && (
                    <div className="flex gap-2 items-center pt-2">
                      <Input
                        placeholder="Adicionar atualização ou comentário..."
                        value={textoComentario[oc.id] || ""}
                        onChange={(e) =>
                          setTextoComentario((prev) => ({
                            ...prev,
                            [oc.id]: e.target.value,
                          }))
                        }
                        className="text-xs h-9"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleEnviarComentario(oc.id);
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleEnviarComentario(oc.id)}
                        disabled={isPendingComentario}
                        className="h-9 px-3 shrink-0 gap-1.5 text-xs"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Enviar
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
