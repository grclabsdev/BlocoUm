"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Copy, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { conviteSchema, type ConviteInput } from "@/lib/validations/auth";
import { convidarMorador } from "@/server/actions/estrutural";

export function ConvidarMoradorDialog({
  condominioId,
  unidades,
}: {
  condominioId: string;
  unidades: any[];
}) {
  const [aberto, setAberto] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [linkGerado, setLinkGerado] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const form = useForm<ConviteInput>({
    resolver: zodResolver(conviteSchema),
    defaultValues: {
      unidadeId: unidades[0]?.id || "",
      tipoOcupacao: "PROPRIETARIO",
      email: "",
    },
  });

  function onSubmit(values: ConviteInput) {
    startTransition(async () => {
      const res = await convidarMorador(condominioId, values);
      if (!res.success) {
        toast.error(res.error || "Erro ao gerar convite.");
        return;
      }
      toast.success("Convite gerado com sucesso!");
      const urlCompleta = `${window.location.origin}${res.data?.inviteUrl}`;
      setLinkGerado(urlCompleta);
      form.setValue("email", "");
    });
  }

  function copiarLink() {
    if (linkGerado) {
      navigator.clipboard.writeText(linkGerado);
      setCopiado(true);
      toast.success("Link copiado para a área de transferência!");
      setTimeout(() => setCopiado(false), 2500);
    }
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(v) => {
        setAberto(v);
        if (!v) setLinkGerado(null);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Mail className="h-4 w-4" />
          Convidar Morador
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Convidar Morador por E-mail</DialogTitle>
            <DialogDescription>
              O morador receberá um link seguro para definir sua senha e ativar o acesso.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <Controller
              name="unidadeId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="unidadeId">Unidade</FieldLabel>
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="unidadeId" aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {unidades.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.identificador} {u.bloco ? `(${u.bloco.nome})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="tipoOcupacao"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="tipoOcupacao">Tipo de Ocupação</FieldLabel>
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="tipoOcupacao" aria-invalid={fieldState.invalid}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROPRIETARIO">Proprietário</SelectItem>
                      <SelectItem value="INQUILINO">Inquilino</SelectItem>
                      <SelectItem value="DEPENDENTE">Dependente / Familiar</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="email">E-mail do Morador</FieldLabel>
                  <Input
                    {...field}
                    id="email"
                    type="email"
                    placeholder="morador@exemplo.com"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {linkGerado && (
              <div className="rounded-lg bg-muted p-3 space-y-2 border">
                <p className="text-xs font-semibold text-foreground">
                  Link direto do convite:
                </p>
                <div className="flex items-center gap-2">
                  <Input value={linkGerado} readOnly className="text-xs bg-background" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={copiarLink}
                    className="shrink-0"
                  >
                    {copiado ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Você também pode enviar este link diretamente ao morador.
                </p>
              </div>
            )}
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAberto(false)}
              disabled={isPending}
            >
              Fechar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Gerando..." : "Gerar Convite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
