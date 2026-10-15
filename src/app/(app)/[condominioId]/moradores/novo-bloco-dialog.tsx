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
import { blocoSchema, type BlocoInput } from "@/lib/validations/estrutural";
import { criarBloco } from "@/server/actions/estrutural";

export function NovoBlocoDialog({ condominioId }: { condominioId: string }) {
  const [aberto, setAberto] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<BlocoInput>({
    resolver: zodResolver(blocoSchema),
    defaultValues: {
      nome: "",
    },
  });

  function onSubmit(values: BlocoInput) {
    startTransition(async () => {
      const res = await criarBloco(condominioId, values);
      if (!res.success) {
        toast.error(res.error || "Erro ao criar bloco.");
        return;
      }
      toast.success("Bloco cadastrado com sucesso!");
      form.reset();
      setAberto(false);
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Building className="h-4 w-4" />
          Novo Bloco
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Cadastrar Bloco / Torre</DialogTitle>
            <DialogDescription>
              Adicione um novo bloco para agrupar as unidades.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <Controller
              name="nome"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="nome">Nome do Bloco</FieldLabel>
                  <Input
                    {...field}
                    id="nome"
                    placeholder="Ex: Bloco A, Torre 1"
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
              {isPending ? "Salvando..." : "Salvar Bloco"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
