"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar } from "lucide-react";
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
  gerarCobrancasMesSchema,
  type GerarCobrancasMesInput,
} from "@/lib/validations/financeiro";
import { gerarCobrancasMes } from "@/server/actions/financeiro";

export function GerarRateioDialog({ condominioId }: { condominioId: string }) {
  const [aberto, setAberto] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hoje = new Date();
  const mesAtualStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;

  const form = useForm<GerarCobrancasMesInput>({
    resolver: zodResolver(gerarCobrancasMesSchema),
    defaultValues: {
      competencia: mesAtualStr,
      diaVencimento: 10,
      valorTotalRateio: 12000,
    },
  });

  function onSubmit(values: GerarCobrancasMesInput) {
    startTransition(async () => {
      const res = await gerarCobrancasMes(condominioId, values);
      if (!res.success) {
        toast.error(res.error || "Erro ao gerar cobranças.");
        return;
      }
      toast.success(
        `Foram geradas ${res.data?.geradas} cobranças para ${values.competencia}!`
      );
      setAberto(false);
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Calendar className="h-4 w-4" />
          Gerar Rateio do Mês
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Gerar Cobranças Mensais</DialogTitle>
            <DialogDescription>
              O sistema distribuirá o valor entre todas as unidades conforme a fração
              ideal ou regra cadastrada.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <Controller
              name="competencia"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="competencia">Mês de Competência</FieldLabel>
                  <Input
                    {...field}
                    id="competencia"
                    type="month"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="diaVencimento"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="diaVencimento">Dia de Vencimento</FieldLabel>
                  <Input
                    {...field}
                    id="diaVencimento"
                    type="number"
                    min={1}
                    max={31}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="valorTotalRateio"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="valorTotalRateio">
                    Valor Total a Ratear (R$)
                  </FieldLabel>
                  <Input
                    {...field}
                    id="valorTotalRateio"
                    type="number"
                    step="0.01"
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
              {isPending ? "Gerando..." : "Confirmar e Gerar Cobranças"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
