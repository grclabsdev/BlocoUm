"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import {
  ocorrenciaSchema,
  type OcorrenciaInput,
} from "@/lib/validations/ocorrencias";
import { criarOcorrencia } from "@/server/actions/ocorrencias";

export function NovaOcorrenciaDialog({ condominioId }: { condominioId: string }) {
  const [aberto, setAberto] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<OcorrenciaInput>({
    resolver: zodResolver(ocorrenciaSchema),
    defaultValues: {
      categoria: "Manutenção Predial",
      titulo: "",
      descricao: "",
      unidadeId: null,
    },
  });

  function onSubmit(values: OcorrenciaInput) {
    startTransition(async () => {
      const res = await criarOcorrencia(condominioId, values);
      if (!res.success) {
        toast.error(res.error || "Erro ao abrir ocorrência.");
        return;
      }
      toast.success("Ocorrência registrada com sucesso!");
      form.reset();
      setAberto(false);
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Abrir Chamado
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Abrir Nova Ocorrência</DialogTitle>
            <DialogDescription>
              Relate um problema de manutenção, segurança ou convivência no condomínio.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <Controller
              name="categoria"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="categoria">Categoria</FieldLabel>
                  <Input
                    {...field}
                    id="categoria"
                    placeholder="Ex: Manutenção Predial, Barulho, Portaria"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="titulo"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="titulo">Título Resumido</FieldLabel>
                  <Input
                    {...field}
                    id="titulo"
                    placeholder="Ex: Vazamento no corredor do 3º andar"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="descricao"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="descricao">Descrição Detalhada</FieldLabel>
                  <Textarea
                    {...field}
                    id="descricao"
                    placeholder="Explique detalhadamente o ocorrido, local exato e horários..."
                    rows={4}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAberto(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Registrando..." : "Registrar Ocorrência"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
