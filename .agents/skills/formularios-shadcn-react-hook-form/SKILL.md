---
name: formularios-shadcn-react-hook-form
description: Como construir formulários deste projeto usando react-hook-form + Zod + os componentes Field do shadcn/ui, e como conectar o submit a uma Server Action. Use sempre que for criar ou editar qualquer formulário (novo lançamento, cadastro de unidade, comunicado, reserva, ocorrência, etc.).
---

# Formulários: react-hook-form + Field (shadcn/ui)

Este é o padrão **atual** do shadcn/ui para formulários (baseado em `<Controller>` + componentes
`<Field>`). Não usar o padrão antigo `<Form>/<FormField>/<FormItem>/<FormControl>/<FormMessage>`
— ele ainda existe em versões antigas da documentação, mas foi substituído por este.

## Componentes shadcn necessários
Instalar (se ainda não estiverem no projeto):
```
npx shadcn add field input-group
```
`field` traz: `Field`, `FieldGroup`, `FieldSet`, `FieldLegend`, `FieldLabel`, `FieldDescription`,
`FieldError`, `FieldContent`, `FieldTitle`.

## Passo a passo

### 1. Schema Zod do módulo
Cada módulo tem seu schema em `src/lib/validations/<modulo>.ts`, reaproveitado tanto no
formulário (client) quanto na Server Action (server) — a mesma fonte de verdade dos dois lados.

```ts
// src/lib/validations/lancamentos.ts
import * as z from "zod"

export const lancamentoSchema = z.object({
  descricao: z.string().min(3, "Descreva o lançamento."),
  valor: z.coerce.number().positive("Valor deve ser maior que zero."),
  categoriaId: z.string().min(1, "Selecione uma categoria."),
  data: z.coerce.date(),
})

export type LancamentoFormValues = z.infer<typeof lancamentoSchema>
```

### 2. Componente de formulário (Client Component isolado)
O formulário é sempre um componente próprio, separado da `page.tsx` (que continua Server
Component) — ver a rule `AGENTS.md` sobre Server vs Client Components.

```tsx
// src/app/(app)/[condominioId]/lancamentos/novo-lancamento-form.tsx
"use client"

import { useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { criarLancamento } from "@/server/actions/lancamentos"
import {
  lancamentoSchema,
  type LancamentoFormValues,
} from "@/lib/validations/lancamentos"

export function NovoLancamentoForm({
  categorias,
  onSuccess,
}: {
  categorias: { id: string; nome: string }[]
  onSuccess?: () => void
}) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<LancamentoFormValues>({
    resolver: zodResolver(lancamentoSchema),
    defaultValues: { descricao: "", valor: 0, categoriaId: "", data: new Date() },
  })

  function onSubmit(values: LancamentoFormValues) {
    startTransition(async () => {
      const resultado = await criarLancamento(values)
      if (resultado?.erro) {
        toast.error(resultado.erro)
        return
      }
      toast.success("Lançamento criado.")
      form.reset()
      onSuccess?.()
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <Controller
          name="descricao"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="descricao">Descrição</FieldLabel>
              <Input {...field} id="descricao" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="valor"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="valor">Valor (R$)</FieldLabel>
              <Input {...field} id="valor" type="number" step="0.01" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="categoriaId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="categoriaId">Categoria</FieldLabel>
              <Select name={field.name} value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="categoriaId" aria-invalid={fieldState.invalid}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <Field orientation="horizontal" className="mt-4">
        <Button type="button" variant="outline" onClick={() => form.reset()} disabled={isPending}>
          Limpar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar lançamento"}
        </Button>
      </Field>
    </form>
  )
}
```

### 3. Server Action correspondente
Sempre revalida o path após a mutação (ver AGENTS.md — nunca `router.refresh()` no client).

```ts
// src/server/actions/lancamentos.ts
"use server"

import { revalidatePath } from "next/cache"
import { lancamentoSchema } from "@/lib/validations/lancamentos"
// ... imports de auth/permissão/prisma

export async function criarLancamento(input: unknown) {
  const parsed = lancamentoSchema.safeParse(input)
  if (!parsed.success) {
    return { erro: "Dados inválidos." }
  }

  // checar sessão + Membership + permissão (ver auth-e-permissoes.md) antes de continuar

  // await prisma.lancamento.create({ data: { ...parsed.data, condominioId } })

  revalidatePath("/lancamentos")
  return { sucesso: true }
}
```

## Padrões por tipo de campo (resumo — ver `.agents/skills` não substitui a doc oficial)
- **Texto/número**: espalhar `field` no `<Input />`, `aria-invalid={fieldState.invalid}` no
  input, `data-invalid={fieldState.invalid}` no `<Field>`.
- **Textarea**: mesma lógica, `<Textarea {...field} aria-invalid={...} />`.
- **Select**: usar `field.value` e `field.onChange` via `onValueChange` (não é um input nativo,
  não dá pra espalhar `field` direto).
- **Checkbox/Switch/RadioGroup**: mesma lógica do Select — `field.value` + `field.onChange`
  (ou `onCheckedChange`/`onValueChange` conforme o componente).
- **Listas dinâmicas** (ex: múltiplos e-mails de contato): usar `useFieldArray` do
  react-hook-form, envolver em `<FieldSet>` + `<FieldLegend>`.

## Erros comuns a evitar
- Controlar campo com `useState` em vez de `Controller`/`register` — não fazer isso neste projeto.
- Misturar o padrão antigo (`FormField`/`FormItem`) com o novo (`Field`/`Controller`) no mesmo
  formulário — escolher um e manter consistente; este projeto usa sempre o padrão `Field`.
- Fazer `fetch` manual para uma API route dentro do `onSubmit` — sempre chamar a Server Action
  diretamente.
- Esquecer `resolver: zodResolver(schema)` — sem isso a validação do Zod não roda.

## Skill oficial complementar (opcional)
O shadcn/ui também publica uma skill genérica de projeto, instalável com
`pnpm dlx skills add shadcn/ui` (via skills.sh). Ela dá ao agente conhecimento geral do catálogo
de componentes, CLI (`shadcn add/search/docs`) e temas — mas não conhece as convenções deste
projeto (Server Actions, `condominioId`, localização dos schemas Zod). Pode instalar como
complemento; esta skill aqui continua sendo a fonte de verdade para como formulário é feito
*neste* projeto.
