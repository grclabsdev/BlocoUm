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
  comunicadoSchema,
  type ComunicadoInput,
} from "@/lib/validations/comunicados";
import { criarComunicado } from "@/server/actions/comunicados";

export function NovoComunicadoDialog({
  condominioId,
  blocos,
}: {
  condominioId: string;
  blocos: any[];
}) {
  const [aberto, setAberto] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ComunicadoInput>({
    resolver: zodResolver(comunicadoSchema),
    defaultValues: {
      titulo: "",
      corpo: "",
      blocoId: null,
    },
  });

  function onSubmit(values: ComunicadoInput) {
    startTransition(async () => {
      const res = await criarComunicado(condominioId, values);
      if (!res.success) {
        toast.error(res.error || "Erro ao publicar comunicado.");
        return;
      }
      toast.success("Comunicado publicado com sucesso!");
      form.reset();
      setAberto(false);
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Novo Comunicado
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Publicar Comunicado</DialogTitle>
            <DialogDescription>
              Envie um aviso para todos os condôminos ou segmente por bloco.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <Controller
              name="titulo"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="titulo">Título do Comunicado</FieldLabel>
                  <Input
                    {...field}
                    id="titulo"
                    placeholder="Ex: Manutenção preventiva nos elevadores"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="blocoId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="blocoId">Segmentação</FieldLabel>
                  <Select
                    name={field.name}
                    value={field.value || "todos"}
                    onValueChange={(v) => field.onChange(v === "todos" ? null : v)}
                  >
                    <SelectTrigger id="blocoId" aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Selecione os destinatários" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os blocos do condomínio</SelectItem>
                      {blocos.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          Apenas {b.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="corpo"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="corpo">Mensagem / Conteúdo</FieldLabel>
                  <Textarea
                    {...field}
                    id="corpo"
                    placeholder="Escreva aqui as instruções, datas e detalhes do comunicado..."
                    rows={5}
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
              {isPending ? "Publicando..." : "Publicar Comunicado"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
