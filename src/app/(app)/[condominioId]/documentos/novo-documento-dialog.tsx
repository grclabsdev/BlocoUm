"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
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
import {
  documentoSchema,
  type DocumentoInput,
} from "@/lib/validations/documentos";
import { criarDocumento } from "@/server/actions/documentos";

export function NovoDocumentoDialog({ condominioId }: { condominioId: string }) {
  const [aberto, setAberto] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<DocumentoInput>({
    resolver: zodResolver(documentoSchema),
    defaultValues: {
      categoria: "ATA",
      titulo: "",
      arquivoUrl: "",
      visivelPara: "TODOS",
    },
  });

  function onSubmit(values: DocumentoInput) {
    startTransition(async () => {
      const res = await criarDocumento(condominioId, values);
      if (!res.success) {
        toast.error(res.error || "Erro ao cadastrar documento.");
        return;
      }
      toast.success("Documento cadastrado com sucesso!");
      form.reset();
      setAberto(false);
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Novo Documento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Publicar Documento</DialogTitle>
            <DialogDescription>
              Adicione um documento oficial com controle de visibilidade.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <Controller
              name="categoria"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="categoria">Categoria</FieldLabel>
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="categoria" aria-invalid={fieldState.invalid}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ATA">Ata de Assembleia</SelectItem>
                      <SelectItem value="REGIMENTO">Regimento Interno</SelectItem>
                      <SelectItem value="CONVENCAO">Convenção Condominial</SelectItem>
                      <SelectItem value="OUTRO">Outros / Pareceres</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="titulo"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="titulo">Título do Documento</FieldLabel>
                  <Input
                    {...field}
                    id="titulo"
                    placeholder="Ex: Ata da Assembleia Geral Ordinária 2026"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="arquivoUrl"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="arquivoUrl">Link / URL do Arquivo</FieldLabel>
                  <Input
                    {...field}
                    id="arquivoUrl"
                    placeholder="https://exemplo.com/documentos/ata.pdf"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="visivelPara"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="visivelPara">Visibilidade</FieldLabel>
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="visivelPara" aria-invalid={fieldState.invalid}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos os condôminos</SelectItem>
                      <SelectItem value="CONSELHO">Exclusivo Síndico e Conselho</SelectItem>
                    </SelectContent>
                  </Select>
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
              {isPending ? "Salvando..." : "Salvar Documento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
