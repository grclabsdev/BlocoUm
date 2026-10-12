"use client";

import { useState } from "react";
import { Shield } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ParametrosForm } from "./parametros-form";
import { AlterarPapelDialog } from "./alterar-papel-dialog";

export function ConfiguracoesTabs({
  condominioId,
  condominio,
  memberships,
  papelUsuarioLogado,
}: {
  condominioId: string;
  condominio: any;
  memberships: any[];
  papelUsuarioLogado: string;
}) {
  const isSindico = papelUsuarioLogado === "SINDICO";
  const podeAlterarMembro = isSindico || papelUsuarioLogado === "SUBSINDICO";

  const [modalMembroAberto, setModalMembroAberto] = useState(false);
  const [membroSelecionado, setMembroSelecionado] = useState<any>(null);

  function abrirModalMembro(membro: any) {
    setMembroSelecionado(membro);
    setModalMembroAberto(true);
  }

  return (
    <>
      <AlterarPapelDialog
        condominioId={condominioId}
        membro={membroSelecionado}
        aberto={modalMembroAberto}
        onOpenChange={setModalMembroAberto}
      />

      <Tabs defaultValue="parametros" className="space-y-4">
        <TabsList>
          <TabsTrigger value="parametros">Parâmetros & Rateio</TabsTrigger>
          <TabsTrigger value="usuarios">
            Gestão de Membros ({memberships.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Parâmetros (Formulário Client Isolado) */}
        <TabsContent value="parametros">
          <ParametrosForm
            condominioId={condominioId}
            condominio={condominio}
          />
        </TabsContent>

        {/* Tab 2: Gestão de Membros */}
        <TabsContent value="usuarios">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Membros e Papéis no Condomínio
              </CardTitle>
              <CardDescription>
                Gerencie quem tem acesso e os níveis de permissão dentro deste condomínio.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Papel Atual</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberships.map((m: any) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-semibold text-foreground">
                        {m.user.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {m.user.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            m.papel === "SINDICO"
                              ? "default"
                              : m.papel === "SUBSINDICO"
                              ? "warning"
                              : m.papel === "CONSELHEIRO"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-xs"
                        >
                          {m.papel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={m.ativo ? "success" : "destructive"}
                          className="text-xs"
                        >
                          {m.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {podeAlterarMembro && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => abrirModalMembro(m)}
                            className="h-8 text-xs gap-1"
                          >
                            Alterar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
