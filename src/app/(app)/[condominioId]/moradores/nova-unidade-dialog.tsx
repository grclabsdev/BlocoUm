"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Home } from "lucide-react";
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
import { unidadeSchema, type UnidadeInput } from "@/lib/validations/estrutural";
import { criarUnidade } from "@/server/actions/estrutural";

export function NovaUnidadeDialog({
  condominioId,
  blocos,
  somaFracaoTotal,
}: {
  condominioId: string;
  blocos: any[];
  somaFracaoTotal: number;
}) {
  const [aberto, setAberto] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<UnidadeInput>({
    resolver: zodResolver(unidadeSchema),
    defaultValues: {
      blocoId: null,
      identificador: "",
      fracaoIdeal: undefined,
    },
  });

  function onSubmit(values: UnidadeInput) {
    startTransition(async () => {
      const res = await criarUnidade(condominioId, values);
      if (!res.success) {
        toast.error(res.error || "Erro ao criar unidade.");
        return;
      }
      toast.success("Unidade cadastrada com sucesso!");
      form.reset();
      setAberto(false);
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Home className="h-4 w-4" />
          Nova Unidade
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Cadastrar Unidade</DialogTitle>
            <DialogDescription>
              Informe o identificador e a fração ideal usada no rateio.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <Controller
              name="blocoId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="blocoId">Bloco (opcional)</FieldLabel>
                  <Select
                    name={field.name}
                    value={field.value || "sem-bloco"}
                    onValueChange={(val) =>
                      field.onChange(val === "sem-bloco" ? null : val)
                    }
                  >
                    <SelectTrigger id="blocoId" aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Selecione o bloco" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sem-bloco">Sem bloco específico</SelectItem>
                      {blocos.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="identificador"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="identificador">
                    Identificador da Unidade
                  </FieldLabel>
                  <Input
                    {...field}
                    id="identificador"
                    placeholder="Ex: Apto 101, Casa 12"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="fracaoIdeal"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className="flex justify-between items-center">
                    <FieldLabel htmlFor="fracaoIdeal">Fração Ideal (%)</FieldLabel>
                    <span className="text-xs text-muted-foreground">
                      Soma atual: {somaFracaoTotal.toFixed(2)}%
                    </span>
                  </div>
                  <Input
                    id="fracaoIdeal"
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    max="100"
                    placeholder="Ex: 15.0000"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    aria-invalid={fieldState.invalid}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    A soma das frações de todas as unidades deve totalizar até 100%.
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
              {isPending ? "Cadastrando..." : "Salvar Unidade"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
