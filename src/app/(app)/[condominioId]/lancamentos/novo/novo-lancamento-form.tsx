"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, TrendingDown, TrendingUp, DollarSign, Calendar, AlignLeft } from "lucide-react";
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
  lancamentoSchema,
  type LancamentoInput,
} from "@/lib/validations/financeiro";
import { criarLancamento } from "@/server/actions/financeiro";

export function NovoLancamentoForm({
  condominioId,
  categorias,
}: {
  condominioId: string;
  categorias: { id: string; nome: string; tipo: "RECEITA" | "DESPESA" }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<LancamentoInput>({
    resolver: zodResolver(lancamentoSchema),
    defaultValues: {
      tipo: "DESPESA",
      categoriaId: categorias.find((c) => c.tipo === "DESPESA")?.id || "",
      descricao: "",
      valor: undefined,
      data: new Date().toISOString().split("T")[0],
    },
  });

  const tipoAtual = form.watch("tipo");
  const categoriasFiltradas = categorias.filter((c) => c.tipo === tipoAtual);

  function onSubmit(values: LancamentoInput) {
    startTransition(async () => {
      const res = await criarLancamento(condominioId, values);
      if (!res.success) {
        toast.error(res.error || "Erro ao criar lançamento.");
        return;
      }
      toast.success("Lançamento registrado com sucesso!");
      form.reset();
      router.push(`/${condominioId}/lancamentos`);
    });
  }

  return (
    <Card className="shadow-lg border-border/80">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-primary" />
            Novo Lançamento Financeiro
          </CardTitle>
          <CardDescription>
            Cadastre uma entrada ou saída de recursos no fluxo de caixa do condomínio.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Seletor Despesa / Receita */}
          <Controller
            name="tipo"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Tipo de Movimentação</FieldLabel>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      field.onChange("DESPESA");
                      const primeira = categorias.find((c) => c.tipo === "DESPESA");
                      if (primeira) form.setValue("categoriaId", primeira.id);
                    }}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-semibold transition cursor-pointer ${
                      field.value === "DESPESA"
                        ? "bg-destructive/10 border-destructive text-destructive"
                        : "bg-muted/40 border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <TrendingDown className="h-4 w-4" />
                    Despesa (Saída)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      field.onChange("RECEITA");
                      const primeira = categorias.find((c) => c.tipo === "RECEITA");
                      if (primeira) form.setValue("categoriaId", primeira.id);
                    }}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-semibold transition cursor-pointer ${
                      field.value === "RECEITA"
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400"
                        : "bg-muted/40 border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <TrendingUp className="h-4 w-4" />
                    Receita (Entrada)
                  </button>
                </div>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <FieldGroup>
            {/* Categoria */}
            <Controller
              name="categoriaId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="categoriaId">Categoria Contábil</FieldLabel>
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="categoriaId" aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriasFiltradas.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Descrição */}
            <Controller
              name="descricao"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="descricao">Descrição / Fornecedor</FieldLabel>
                  <div className="relative">
                    <AlignLeft className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      {...field}
                      id="descricao"
                      placeholder="Ex: Manutenção dos portões elétricos da garagem"
                      className="pl-9"
                      aria-invalid={fieldState.invalid}
                    />
                  </div>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Valor e Data em grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                name="valor"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="valor">Valor (R$)</FieldLabel>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="valor"
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        className="pl-9 font-semibold"
                        aria-invalid={fieldState.invalid}
                      />
                    </div>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="data"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="data">Data do Lançamento</FieldLabel>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        id="data"
                        type="date"
                        className="pl-9"
                        aria-invalid={fieldState.invalid}
                      />
                    </div>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
          </FieldGroup>
        </CardContent>

        <CardFooter className="flex justify-end gap-2 border-t pt-4">
          <Button asChild variant="outline" disabled={isPending}>
            <Link href={`/${condominioId}/lancamentos`}>Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isPending} className="gap-2">
            {isPending ? "Salvando..." : "Salvar Lançamento"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
