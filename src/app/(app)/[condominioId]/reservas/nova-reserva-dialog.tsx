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
  reservaSchema,
  type ReservaInput,
} from "@/lib/validations/reservas";
import { criarReserva } from "@/server/actions/reservas";

export function NovaReservaDialog({
  condominioId,
  areas,
  unidades,
  usuarioUnidadeId,
  isSindico,
}: {
  condominioId: string;
  areas: any[];
  unidades: any[];
  usuarioUnidadeId?: string;
  isSindico: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ReservaInput>({
    resolver: zodResolver(reservaSchema),
    defaultValues: {
      areaComumId: areas[0]?.id || "",
      unidadeId: usuarioUnidadeId || unidades[0]?.id || "",
      inicio: "",
      fim: "",
    },
  });

  function onSubmit(values: ReservaInput) {
    startTransition(async () => {
      const res = await criarReserva(condominioId, values);
      if (!res.success) {
        toast.error(res.error || "Conflito ou erro ao agendar reserva.");
        return;
      }
      toast.success("Reserva confirmada com sucesso!");
      form.reset();
      setAberto(false);
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Nova Reserva
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Reservar Espaço</DialogTitle>
            <DialogDescription>
              Escolha o local e os horários. O sistema verificará conflitos de agenda
              automaticamente.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <Controller
              name="areaComumId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="areaComumId">Espaço Compartilhado</FieldLabel>
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="areaComumId" aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Selecione o espaço" />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.nome} (mínimo {a.antecedenciaMinHrs}h de antecedência)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {isSindico && (
              <Controller
                name="unidadeId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="unidadeId">Unidade Solicitante</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="unidadeId" aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Selecione a unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {unidades.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.identificador} {u.bloco ? `(${u.bloco.nome})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            )}

            <Controller
              name="inicio"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="inicio">Início da Reserva</FieldLabel>
                  <Input
                    {...field}
                    id="inicio"
                    type="datetime-local"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="fim"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="fim">Término da Reserva</FieldLabel>
                  <Input
                    {...field}
                    id="fim"
                    type="datetime-local"
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
              {isPending ? "Validando e Agendando..." : "Confirmar Reserva"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
