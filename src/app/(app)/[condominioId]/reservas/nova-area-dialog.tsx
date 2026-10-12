"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building } from "lucide-react";
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
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import {
  areaComumSchema,
  type AreaComumInput,
} from "@/lib/validations/reservas";
import { criarAreaComum } from "@/server/actions/reservas";

export function NovaAreaDialog({ condominioId }: { condominioId: string }) {
  const [aberto, setAberto] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<AreaComumInput>({
    resolver: zodResolver(areaComumSchema),
    defaultValues: {
      nome: "",
      antecedenciaMinHrs: 24,
    },
  });

  function onSubmit(values: AreaComumInput) {
    startTransition(async () => {
      const res = await criarAreaComum(condominioId, values);
      if (!res.success) {
        toast.error(res.error || "Erro ao cadastrar área.");
        return;
      }
      toast.success("Área comum cadastrada com sucesso!");
      form.reset();
      setAberto(false);
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Building className="h-4 w-4" />
          Cadastrar Área
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Nova Área Comum</DialogTitle>
            <DialogDescription>
              Cadastre um espaço de convivência com antecedência mínima de agendamento.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <Controller
              name="nome"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="nome">Nome do Espaço</FieldLabel>
                  <Input
                    {...field}
                    id="nome"
                    placeholder="Ex: Salão de Festas, Churrasqueira Gourmet"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="antecedenciaMinHrs"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="antecedenciaMinHrs">
                    Antecedência Mínima (em horas)
                  </FieldLabel>
                  <Input
                    id="antecedenciaMinHrs"
                    type="number"
                    min="0"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                    aria-invalid={fieldState.invalid}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Exemplo: 24 horas impede reservas com início em menos de 1 dia.
                  </p>
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
              {isPending ? "Cadastrando..." : "Salvar Área"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
