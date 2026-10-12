"use client";

import { useState, useTransition } from "react";
import {
  FileText,
  Trash2,
  Lock,
  Globe,
  FileCheck,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { formatData } from "@/lib/formatters";
import { excluirDocumento } from "@/server/actions/documentos";

export function DocumentosTabs({
  documentos,
  podeGerenciar,
  condominioId,
  onNovoClick,
}: {
  documentos: any[];
  podeGerenciar: boolean;
  condominioId: string;
  onNovoClick?: () => void;
}) {
  const [abaAtiva, setAbaAtiva] = useState("TODOS_TAB");
  const [isPending, startTransition] = useTransition();

  const docsFiltrados =
    abaAtiva === "TODOS_TAB"
      ? documentos
      : documentos.filter((d: any) => d.categoria === abaAtiva);

  function handleExcluir(documentoId: string) {
    if (!confirm("Deseja realmente remover este documento?")) return;
    startTransition(async () => {
      const res = await excluirDocumento(condominioId, documentoId);
      if (!res.success) {
        toast.error(res.error || "Erro ao excluir documento.");
      } else {
        toast.success("Documento removido.");
      }
    });
  }

  return (
    <Tabs
      defaultValue="TODOS_TAB"
      value={abaAtiva}
      onValueChange={setAbaAtiva}
      className="space-y-4"
    >
      <TabsList>
        <TabsTrigger value="TODOS_TAB">Todos ({documentos.length})</TabsTrigger>
        <TabsTrigger value="CONVENCAO">Convenção</TabsTrigger>
        <TabsTrigger value="REGIMENTO">Regimento</TabsTrigger>
        <TabsTrigger value="ATA">Atas</TabsTrigger>
        <TabsTrigger value="OUTRO">Pareceres / Outros</TabsTrigger>
      </TabsList>

      <TabsContent value={abaAtiva}>
        {docsFiltrados.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhum documento nesta categoria"
            description="Cadastre documentos oficiais para que os moradores e membros do conselho possam consultar."
            actionLabel={podeGerenciar ? "Adicionar documento" : undefined}
            onAction={onNovoClick}
          />
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Visibilidade</TableHead>
                  <TableHead>Publicado em</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docsFiltrados.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium text-foreground flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-primary shrink-0" />
                      {d.titulo}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {d.categoria}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {d.visivelPara === "CONSELHO" ? (
                        <Badge variant="warning" className="text-xs gap-1">
                          <Lock className="h-3 w-3" />
                          Conselho
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Globe className="h-3 w-3" />
                          Todos
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatData(d.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-xs"
                        >
                          <a href={d.arquivoUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                            Acessar
                          </a>
                        </Button>
                        {podeGerenciar && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleExcluir(d.id)}
                            disabled={isPending}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
