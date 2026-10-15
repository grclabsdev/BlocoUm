"use client";

import { useEffect, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  membershipPapelSchema,
  type MembershipPapelInput,
} from "@/lib/validations/configuracoes";
import { alterarPapelMembro } from "@/server/actions/configuracoes";

export function AlterarPapelDialog({
  condominioId,
  membro,
  aberto,
  onOpenChange,
}: {
  condominioId: string;
  membro: any;
  aberto: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<MembershipPapelInput>({
    resolver: zodResolver(membershipPapelSchema),
    defaultValues: {
      membershipId: membro?.id || "",
      papel: membro?.papel || "MORADOR",
      ativo: membro?.ativo ?? true,
    },
  });

  useEffect(() => {
    if (membro) {
      form.reset({
        membershipId: membro.id,
        papel: membro.papel,
        ativo: membro.ativo,
      });
    }
  }, [membro, form]);

  function onSubmit(values: MembershipPapelInput) {
    startTransition(async () => {
      const res = await alterarPapelMembro(condominioId, values);
      if (!res.success) {
        toast.error(res.error || "Erro ao alterar papel do membro.");
        return;
      }
      toast.success("Papel do usuário atualizado com sucesso!");
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Gerenciar Acesso do Usuário</DialogTitle>
            <DialogDescription>
              Usuário: <strong>{membro?.user?.name}</strong> ({membro?.user?.email})
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <Controller
              name="papel"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="papel">Papel no Condomínio</FieldLabel>
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="papel" aria-invalid={fieldState.invalid}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SINDICO">Síndico (Acesso total)</SelectItem>
                      <SelectItem value="SUBSINDICO">Subsíndico</SelectItem>
                      <SelectItem value="CONSELHEIRO">Conselheiro (Leitura)</SelectItem>
                      <SelectItem value="MORADOR">Morador</SelectItem>
                      <SelectItem value="FUNCIONARIO">
                        Funcionário (Portaria/Zeladoria)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="ativo"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="ativo">Status do Acesso</FieldLabel>
                  <Select
                    name={field.name}
                    value={field.value ? "ativo" : "inativo"}
                    onValueChange={(val) => field.onChange(val === "ativo")}
                  >
                    <SelectTrigger id="ativo" aria-invalid={fieldState.invalid}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo (Acesso permitido)</SelectItem>
                      <SelectItem value="inativo">Inativo (Acesso bloqueado)</SelectItem>
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
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
