"use client";

import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  condominioConfigSchema,
  type CondominioConfigInput,
} from "@/lib/validations/configuracoes";
import { salvarParametrosCondominio } from "@/server/actions/configuracoes";

export function ParametrosForm({
  condominioId,
  condominio,
}: {
  condominioId: string;
  condominio: any;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<CondominioConfigInput>({
    resolver: zodResolver(condominioConfigSchema),
    defaultValues: {
      nome: condominio.nome,
      cnpj: condominio.cnpj || "",
      endereco: condominio.endereco,
      rateioTipo: condominio.rateioTipo,
      diaVencimento: condominio.diaVencimento,
      multaAtrasoPct: condominio.multaAtrasoPct,
      jurosMesPct: condominio.jurosMesPct,
    },
  });

  function onSubmit(values: CondominioConfigInput) {
    startTransition(async () => {
      const res = await salvarParametrosCondominio(condominioId, values);
      if (!res.success) {
        toast.error(res.error || "Erro ao salvar parâmetros.");
        return;
      }
      toast.success("Parâmetros do condomínio atualizados com sucesso!");
    });
  }

  return (
    <Card className="shadow-xs">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Dados do Condomínio e Regras de Cobrança
          </CardTitle>
          <CardDescription>
            Configure as regras de rateio e encargos legais aplicados pelo sistema.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <FieldGroup>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                name="nome"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="nome">Nome do Condomínio</FieldLabel>
                    <Input {...field} id="nome" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="cnpj"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="cnpj">CNPJ</FieldLabel>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      id="cnpj"
                      placeholder="00.000.000/0000-00"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <Controller
              name="endereco"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="endereco">Endereço Completo</FieldLabel>
                  <Input {...field} id="endereco" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
              <Controller
                name="rateioTipo"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="rateioTipo">
                      Regra de Rateio da Taxa Condominial
                    </FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="rateioTipo" aria-invalid={fieldState.invalid}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FRACAO_IDEAL">
                          Por Fração Ideal (Padrão Legal)
                        </SelectItem>
                        <SelectItem value="IGUALITARIO">
                          Rateio Igualitário (Valor fixo por unidade)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="diaVencimento"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="diaVencimento">
                      Dia Padrão de Vencimento
                    </FieldLabel>
                    <Input
                      id="diaVencimento"
                      type="number"
                      min={1}
                      max={31}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
              <Controller
                name="multaAtrasoPct"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="multaAtrasoPct">
                      Multa por Atraso (%)
                    </FieldLabel>
                    <Input
                      id="multaAtrasoPct"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      aria-invalid={fieldState.invalid}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Padrão legal do Código Civil (art. 1.336 §1º): 2,0%.
                    </p>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="jurosMesPct"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="jurosMesPct">
                      Juros Moratórios ao Mês (%)
                    </FieldLabel>
                    <Input
                      id="jurosMesPct"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      aria-invalid={fieldState.invalid}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Padrão legal: 1,0% ao mês, calculados pro rata die sobre os dias de atraso.
                    </p>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
          </FieldGroup>
        </CardContent>

        <CardFooter className="border-t pt-4 flex justify-end">
          <Button type="submit" disabled={isPending} className="gap-2">
            <Save className="h-4 w-4" />
            {isPending ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
