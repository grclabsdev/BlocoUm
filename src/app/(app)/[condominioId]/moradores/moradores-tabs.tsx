"use client";

import { Home, Users, Mail, Copy, UserCheck } from "lucide-react";
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
import { formatPercentual } from "@/lib/formatters";

export function MoradoresTabs({
  unidades,
  blocos,
  perfis,
  convites,
}: {
  unidades: any[];
  blocos: any[];
  perfis: any[];
  convites: any[];
}) {
  function copiarLink(token: string) {
    const url = `${window.location.origin}/convite/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link do convite copiado!");
  }

  return (
    <Tabs defaultValue="unidades" className="space-y-4">
      <TabsList>
        <TabsTrigger value="unidades">Unidades & Blocos ({unidades.length})</TabsTrigger>
        <TabsTrigger value="moradores">Moradores Vinculados ({perfis.length})</TabsTrigger>
        <TabsTrigger value="convites">Convites ({convites.length})</TabsTrigger>
      </TabsList>

      {/* Tab 1: Unidades */}
      <TabsContent value="unidades">
        {unidades.length === 0 ? (
          <EmptyState
            icon={Home}
            title="Nenhuma unidade cadastrada"
            description="Cadastre as unidades e suas frações ideais para poder realizar lançamentos e cobranças."
          />
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Identificador</TableHead>
                  <TableHead>Bloco / Torre</TableHead>
                  <TableHead>Fração Ideal</TableHead>
                  <TableHead>Moradores</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unidades.map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-semibold text-foreground">
                      {u.identificador}
                    </TableCell>
                    <TableCell>{u.bloco?.nome || "Geral"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {formatPercentual(u.fracaoIdeal, 2)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.moradores.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">Vago</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {u.moradores.map((m: any) => (
                            <Badge key={m.id} variant="secondary" className="text-xs gap-1">
                              <UserCheck className="h-3 w-3" />
                              {m.user.name} ({m.tipoOcupacao})
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </TabsContent>

      {/* Tab 2: Moradores */}
      <TabsContent value="moradores">
        {perfis.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum morador vinculado"
            description="Envie um convite por e-mail para que os moradores ativem suas contas."
          />
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perfis.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-foreground">{p.user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{p.user.email}</TableCell>
                    <TableCell>
                      {p.unidade.identificador}{" "}
                      {p.unidade.bloco ? `(${p.unidade.bloco.nome})` : ""}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs uppercase">
                        {p.tipoOcupacao}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </TabsContent>

      {/* Tab 3: Convites */}
      <TabsContent value="convites">
        {convites.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="Nenhum convite enviado"
            description="Convide novos moradores para acessar o aplicativo."
          />
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Ocupação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {convites.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-foreground">{c.email}</TableCell>
                    <TableCell>{c.unidade.identificador}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.tipoOcupacao}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          c.status === "ACEITO"
                            ? "success"
                            : c.status === "EXPIRADO"
                            ? "destructive"
                            : "warning"
                        }
                        className="text-xs"
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {c.status === "PENDENTE" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copiarLink(c.token)}
                          className="h-8 gap-1.5 text-xs"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copiar link
                        </Button>
                      )}
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
