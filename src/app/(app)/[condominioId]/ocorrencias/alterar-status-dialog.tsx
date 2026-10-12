"use client";

import { useEffect, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import {
  alterarStatusOcorrenciaSchema,
  type AlterarStatusOcorrenciaInput,
} from "@/lib/validations/ocorrencias";
import { alterarStatusOcorrencia } from "@/server/actions/ocorrencias";

export function AlterarStatusDialog({
  condominioId,
  ocorrencia,
  novoStatus,
  aberto,
  onOpenChange,
}: {
  condominioId: string;
  ocorrencia: any;
  novoStatus: "ABERTA" | "EM_ANDAMENTO" | "RESOLVIDA" | "CANCELADA" | "";
  aberto: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<AlterarStatusOcorrenciaInput>({
    resolver: zodResolver(alterarStatusOcorrenciaSchema),
    defaultValues: {
      ocorrenciaId: ocorrencia?.id || "",
      novoStatus: novoStatus || "EM_ANDAMENTO",
      motivo: "",
    },
  });

  useEffect(() => {
    if (ocorrencia && novoStatus) {
      form.reset({
        ocorrenciaId: ocorrencia.id,
        novoStatus,
        motivo: "",
      });
    }
  }, [ocorrencia, novoStatus, form]);

  function onSubmit(values: AlterarStatusOcorrenciaInput) {
    startTransition(async () => {
      const res = await alterarStatusOcorrencia(condominioId, values);
      if (!res.success) {
        toast.error(res.error || "Erro ao atualizar status.");
        return;
      }
      toast.success("Status atualizado com sucesso!");
      form.reset();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Atualizar Status do Chamado</DialogTitle>
            <DialogDescription>
              Alterando chamado para <strong>{novoStatus}</strong>.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            {novoStatus === "CANCELADA" ? (
              <Controller
                name="motivo"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="motivo">
                      Motivo do Cancelamento (obrigatório)
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id="motivo"
                      placeholder="Justifique o motivo do cancelamento deste chamado..."
                      rows={3}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Confirma a mudança de status deste chamado para <strong>{novoStatus}</strong>? O sistema registrará uma nota de auditoria automática no histórico.
              </p>
            )}
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Atualizando..." : "Confirmar Alteração"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
