"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  User,
  Mail,
  KeyRound,
  MapPin,
  Calendar,
  Layers,
  Home,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  Trash2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  criarCondominioOnboarding,
  type ConviteGerado,
  type OnboardingResultado,
} from "@/server/actions/onboarding";
import { signIn } from "@/lib/auth/auth-client";
import { toast } from "sonner";

interface NovoCondominioWizardProps {
  initialUser?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
}

export function NovoCondominioWizard({ initialUser }: NovoCondominioWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [passo, setPasso] = useState<number>(1);
  const [copiadoIdx, setCopiadoIdx] = useState<number | null>(null);
  const [resultadoSucesso, setResultadoSucesso] = useState<OnboardingResultado | null>(null);

  // Passo 1: Administrador / Síndico
  const [adminNome, setAdminNome] = useState(initialUser?.name || "");
  const [adminEmail, setAdminEmail] = useState(initialUser?.email || "");
  const [adminPassword, setAdminPassword] = useState("");

  // Passo 2: Condomínio
  const [condoNome, setCondoNome] = useState("");
  const [condoCnpj, setCondoCnpj] = useState("");
  const [condoEndereco, setCondoEndereco] = useState("");
  const [condoVencimento, setCondoVencimento] = useState(10);
  const [condoRateio, setCondoRateio] = useState<"FRACAO_IDEAL" | "IGUALITARIO">("FRACAO_IDEAL");

  // Passo 3: Blocos e Unidades
  const [temBlocos, setTemBlocos] = useState(true);
  const [listaBlocos, setListaBlocos] = useState<string[]>(["Bloco A", "Bloco B"]);
  const [novoBlocoInput, setNovoBlocoInput] = useState("");

  const [listaUnidades, setListaUnidades] = useState<
    Array<{ identificador: string; blocoNome?: string; fracaoIdeal?: number }>
  >([
    { identificador: "Apto 101", blocoNome: "Bloco A" },
    { identificador: "Apto 102", blocoNome: "Bloco A" },
    { identificador: "Apto 201", blocoNome: "Bloco A" },
    { identificador: "Apto 202", blocoNome: "Bloco A" },
    { identificador: "Apto 101", blocoNome: "Bloco B" },
    { identificador: "Apto 102", blocoNome: "Bloco B" },
    { identificador: "Apto 201", blocoNome: "Bloco B" },
    { identificador: "Apto 202", blocoNome: "Bloco B" },
  ]);

  const [novaUnidadeId, setNovaUnidadeId] = useState("");
  const [novaUnidadeBloco, setNovaUnidadeBloco] = useState("Bloco A");

  // Passo 4: Convite de Moradores
  const [listaConvites, setListaConvites] = useState<
    Array<{
      email: string;
      unidadeIdentificador: string;
      tipoOcupacao: "PROPRIETARIO" | "INQUILINO" | "DEPENDENTE";
    }>
  >([]);

  const [conviteEmail, setConviteEmail] = useState("");
  const [conviteUnidade, setConviteUnidade] = useState("");
  const [conviteOcupacao, setConviteOcupacao] = useState<"PROPRIETARIO" | "INQUILINO">("PROPRIETARIO");

  // Funções de manipulação do Passo 3 (Blocos e Unidades)
  function handleAdicionarBloco() {
    if (!novoBlocoInput.trim()) return;
    if (listaBlocos.includes(novoBlocoInput.trim())) {
      toast.error("Este bloco já está cadastrado.");
      return;
    }
    const atualizados = [...listaBlocos, novoBlocoInput.trim()];
    setListaBlocos(atualizados);
    setNovoBlocoInput("");
  }

  function handleRemoverBloco(nome: string) {
    setListaBlocos(listaBlocos.filter((b) => b !== nome));
    setListaUnidades(listaUnidades.filter((u) => u.blocoNome !== nome));
  }

  function handleAdicionarUnidade() {
    if (!novaUnidadeId.trim()) return;
    const jaExiste = listaUnidades.some(
      (u) =>
        u.identificador.toLowerCase() === novaUnidadeId.trim().toLowerCase() &&
        (temBlocos ? u.blocoNome === novaUnidadeBloco : true)
    );
    if (jaExiste) {
      toast.error("Esta unidade já está cadastrada neste bloco.");
      return;
    }

    setListaUnidades([
      ...listaUnidades,
      {
        identificador: novaUnidadeId.trim(),
        blocoNome: temBlocos ? novaUnidadeBloco : undefined,
      },
    ]);
    setNovaUnidadeId("");
  }

  function handleRemoverUnidade(idx: number) {
    setListaUnidades(listaUnidades.filter((_, i) => i !== idx));
  }

  // Funções de manipulação do Passo 4 (Convites)
  function handleAdicionarConvite() {
    if (!conviteEmail.trim() || !conviteUnidade.trim()) {
      toast.error("Preencha o e-mail e escolha a unidade para o convite.");
      return;
    }
    if (listaConvites.some((c) => c.email.toLowerCase() === conviteEmail.trim().toLowerCase())) {
      toast.error("Este e-mail já foi adicionado aos convites.");
      return;
    }

    setListaConvites([
      ...listaConvites,
      {
        email: conviteEmail.trim().toLowerCase(),
        unidadeIdentificador: conviteUnidade,
        tipoOcupacao: conviteOcupacao,
      },
    ]);
    setConviteEmail("");
  }

  function handleRemoverConvite(idx: number) {
    setListaConvites(listaConvites.filter((_, i) => i !== idx));
  }

  // Validação por passo para avançar
  function validarPassoAtual(): boolean {
    if (passo === 1) {
      if (!adminNome.trim() || !adminEmail.trim()) {
        toast.error("Informe seu nome e e-mail.");
        return false;
      }
      if (!initialUser && adminPassword.length < 8) {
        toast.error("A senha deve conter no mínimo 8 caracteres.");
        return false;
      }
    } else if (passo === 2) {
      if (!condoNome.trim()) {
        toast.error("Informe o nome do condomínio.");
        return false;
      }
      if (!condoEndereco.trim()) {
        toast.error("Informe o endereço completo do condomínio.");
        return false;
      }
    } else if (passo === 3) {
      if (listaUnidades.length === 0) {
        toast.error("Adicione pelo menos 1 unidade.");
        return false;
      }
    }
    return true;
  }

  function avancarPasso() {
    if (validarPassoAtual()) {
      setPasso((p) => Math.min(5, p + 1));
    }
  }

  function voltarPasso() {
    setPasso((p) => Math.max(1, p - 1));
  }

  // Submissão final do Onboarding
  function handleFinalizarOnboarding() {
    startTransition(async () => {
      const payload = {
        admin: {
          nome: adminNome,
          email: adminEmail,
          password: adminPassword || undefined,
        },
        condominio: {
          nome: condoNome,
          cnpj: condoCnpj || undefined,
          endereco: condoEndereco,
          diaVencimento: Number(condoVencimento),
          rateioTipo: condoRateio,
        },
        blocos: temBlocos ? listaBlocos.map((nome) => ({ nome })) : [],
        unidades: listaUnidades.map((u) => ({
          identificador: u.identificador,
          blocoNome: u.blocoNome,
        })),
        convites: listaConvites,
      };

      const res = await criarCondominioOnboarding(payload);

      if (!res.success || !res.data) {
        toast.error(res.error || "Ocorreu um erro ao criar o condomínio.");
        return;
      }

      toast.success("Condomínio criado com sucesso!");
      setResultadoSucesso(res.data);

      // Se o usuário acabou de criar a conta e forneceu senha, autentica-o no client
      if (!initialUser && adminPassword) {
        await signIn.email({
          email: adminEmail,
          password: adminPassword,
        });
      }
    });
  }

  function copiarLink(link: string, idx: number) {
    const urlCompleta = `${window.location.origin}${link}`;
    navigator.clipboard.writeText(urlCompleta);
    setCopiadoIdx(idx);
    toast.success("Link copiado para a área de transferência!");
    setTimeout(() => setCopiadoIdx(null), 2500);
  }

  // ---------------------------------------------------------------------------
  // TELA DE SUCESSO PÓS-CRIAÇÃO
  // ---------------------------------------------------------------------------
  if (resultadoSucesso) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <Card className="border-emerald-500/30 shadow-xl overflow-hidden">
          <div className="bg-emerald-600/10 border-b border-emerald-500/20 p-6 text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              Parabéns! O condomínio foi criado
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              O condomínio <strong>{resultadoSucesso.condominioNome}</strong> está ativo com{" "}
              <strong>2 meses grátis</strong> de teste no módulo Núcleo.
            </p>
          </div>

          <CardContent className="p-6 space-y-6">
            {resultadoSucesso.convitesGerados.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <UserPlus className="h-4 w-4 text-primary" />
                    Links de convite gerados ({resultadoSucesso.convitesGerados.length}):
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Envie via WhatsApp ou E-mail
                  </span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {resultadoSucesso.convitesGerados.map((c, i) => (
                    <div
                      key={c.token}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/40 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{c.email}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {c.unidade} · {c.tipoOcupacao}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copiarLink(c.link, i)}
                        className="h-8 gap-1.5 shrink-0 text-xs"
                      >
                        {copiadoIdx === i ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            Copiar link
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border bg-muted/30 p-4 text-center text-xs text-muted-foreground">
                Nenhum morador foi convidado nesta etapa. Você poderá convidar novos moradores a
                qualquer momento dentro do painel em <strong>Moradores</strong>.
              </div>
            )}

            <div className="rounded-xl border bg-primary/5 p-4 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground block mb-0.5">Seu período de teste já começou!</strong>
                Aproveite 60 dias de acesso completo a lançamentos financeiros, comunicados,
                reservas, chamados e controle de unidades.
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-6 bg-muted/20 border-t flex flex-col sm:flex-row gap-3">
            <Button
              className="w-full gap-2 text-base font-semibold py-6 shadow-md"
              onClick={() => {
                router.push(`/${resultadoSucesso.condominioId}/dashboard`);
                router.refresh();
              }}
            >
              Ir para o Painel do Condomínio
              <ArrowRight className="h-5 w-5" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // FLUXO DO WIZARD DE ONBOARDING (PASSOS 1 A 5)
  // ---------------------------------------------------------------------------
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Cabeçalho do Onboarding */}
      <div className="text-center space-y-2">
        <Badge variant="outline" className="gap-1.5 py-1 px-3 text-xs border-primary/30 text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Onboarding Rápido · 2 Meses Grátis
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Criar Novo Condomínio
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Configure a estrutura do seu prédio ou condomínio em menos de 3 minutos.
        </p>
      </div>

      {/* Indicador Visual de Passos */}
      <div className="grid grid-cols-5 gap-2 px-2 text-center text-xs font-medium">
        {[
          { id: 1, label: "Síndico" },
          { id: 2, label: "Condomínio" },
          { id: 3, label: "Estrutura" },
          { id: 4, label: "Moradores" },
          { id: 5, label: "Revisão" },
        ].map((s) => (
          <div key={s.id} className="space-y-1">
            <div
              className={`h-1.5 w-full rounded-full transition-all ${
                passo >= s.id ? "bg-primary" : "bg-muted"
              }`}
            />
            <span
              className={`hidden sm:inline ${
                passo === s.id ? "text-primary font-bold" : "text-muted-foreground"
              }`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <Card className="shadow-lg border-border/80">
        {/* ---------------------------------------------------------------- */}
        {/* PASSO 1: DADOS DO SÍNDICO / ADMINISTRADOR                         */}
        {/* ---------------------------------------------------------------- */}
        {passo === 1 && (
          <>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Dados do Administrador (Síndico)
              </CardTitle>
              <CardDescription>
                Esta será a conta principal com privilégios de gestão total sobre o condomínio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {initialUser && (
                <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>
                    Você está conectado como <strong>{initialUser.email}</strong>. Este usuário
                    será o síndico do novo condomínio.
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="adminNome">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="adminNome"
                    placeholder="Ex: Carlos Albuquerque"
                    value={adminNome}
                    onChange={(e) => setAdminNome(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail">E-mail Profissional ou Pessoal</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="sindico@exemplo.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    disabled={!!initialUser}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              {!initialUser && (
                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Senha de Acesso</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="adminPassword"
                      type="password"
                      placeholder="Mínimo de 8 caracteres"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* PASSO 2: DADOS DO CONDOMÍNIO                                      */}
        {/* ---------------------------------------------------------------- */}
        {passo === 2 && (
          <>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Informações do Condomínio
              </CardTitle>
              <CardDescription>
                Identificação do condomínio residencial para emissão de cobranças e relatórios.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="condoNome">Nome do Condomínio</Label>
                <Input
                  id="condoNome"
                  placeholder="Ex: Residencial Solar das Acácias"
                  value={condoNome}
                  onChange={(e) => setCondoNome(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="condoCnpj">CNPJ (Opcional)</Label>
                  <Input
                    id="condoCnpj"
                    placeholder="00.000.000/0001-00"
                    value={condoCnpj}
                    onChange={(e) => setCondoCnpj(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condoVencimento">Dia do Vencimento da Taxa</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="condoVencimento"
                      type="number"
                      min={1}
                      max={28}
                      value={condoVencimento}
                      onChange={(e) => setCondoVencimento(Number(e.target.value))}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condoEndereco">Endereço Completo</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="condoEndereco"
                    placeholder="Rua das Palmeiras, 150 — Bairro Jardim, Cidade - UF"
                    value={condoEndereco}
                    onChange={(e) => setCondoEndereco(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Critério de Rateio da Taxa Condominial</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCondoRateio("FRACAO_IDEAL")}
                    className={`rounded-lg border p-3 text-left text-xs transition cursor-pointer ${
                      condoRateio === "FRACAO_IDEAL"
                        ? "border-primary bg-primary/10 font-semibold text-primary"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <p className="font-medium text-foreground">Fração Ideal</p>
                    <p className="text-[11px] text-muted-foreground">
                      Proporcional ao tamanho/área de cada unidade.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCondoRateio("IGUALITARIO")}
                    className={`rounded-lg border p-3 text-left text-xs transition cursor-pointer ${
                      condoRateio === "IGUALITARIO"
                        ? "border-primary bg-primary/10 font-semibold text-primary"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <p className="font-medium text-foreground">Divisão Igualitária</p>
                    <p className="text-[11px] text-muted-foreground">
                      Valor dividido em partes iguais entre todas as unidades.
                    </p>
                  </button>
                </div>
              </div>
            </CardContent>
          </>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* PASSO 3: ESTRUTURA (BLOCOS E UNIDADES)                            */}
        {/* ---------------------------------------------------------------- */}
        {passo === 3 && (
          <>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Estrutura de Blocos e Unidades
              </CardTitle>
              <CardDescription>
                Defina como seu condomínio é organizado (torres/blocos e números dos apartamentos).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Opção Bloco vs Torre Única */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="checkBlocos"
                  checked={temBlocos}
                  onChange={(e) => setTemBlocos(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                />
                <Label htmlFor="checkBlocos" className="text-sm font-medium cursor-pointer">
                  O condomínio é dividido em múltiplos blocos ou torres
                </Label>
              </div>

              {/* Gerenciamento de Blocos */}
              {temBlocos && (
                <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                  <Label className="text-xs uppercase font-semibold text-muted-foreground">
                    Blocos Cadastrados
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {listaBlocos.map((b) => (
                      <Badge
                        key={b}
                        variant="secondary"
                        className="gap-1.5 py-1 px-2.5 text-xs font-medium"
                      >
                        {b}
                        <button
                          type="button"
                          onClick={() => handleRemoverBloco(b)}
                          className="hover:text-destructive cursor-pointer ml-1"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Input
                      placeholder="Nome do bloco (ex: Torre Sul)"
                      value={novoBlocoInput}
                      onChange={(e) => setNovoBlocoInput(e.target.value)}
                      className="h-9 text-xs"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAdicionarBloco}
                      className="gap-1 shrink-0 h-9"
                    >
                      <Plus className="h-3.5 w-3.5" /> Adicionar Bloco
                    </Button>
                  </div>
                </div>
              )}

              {/* Gerenciamento de Unidades */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase font-semibold text-muted-foreground">
                    Unidades / Apartamentos ({listaUnidades.length})
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    Fração ideal: {(100 / Math.max(1, listaUnidades.length)).toFixed(2)}% por unidade
                  </span>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Identificador (ex: Apto 301)"
                    value={novaUnidadeId}
                    onChange={(e) => setNovaUnidadeId(e.target.value)}
                    className="h-9 text-xs"
                  />
                  {temBlocos && listaBlocos.length > 0 && (
                    <select
                      value={novaUnidadeBloco}
                      onChange={(e) => setNovaUnidadeBloco(e.target.value)}
                      className="h-9 rounded-md border border-input bg-background px-3 text-xs"
                    >
                      {listaBlocos.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAdicionarUnidade}
                    className="gap-1 shrink-0 h-9"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar
                  </Button>
                </div>

                {/* Lista de Unidades */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-52 overflow-y-auto p-1 border rounded-lg bg-card">
                  {listaUnidades.map((u, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-md border bg-muted/30 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-semibold block truncate">{u.identificador}</span>
                        {u.blocoNome && (
                          <span className="text-[10px] text-muted-foreground">{u.blocoNome}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoverUnidade(i)}
                        className="text-muted-foreground hover:text-destructive shrink-0 ml-1 p-0.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* PASSO 4: CONVITE DE MORADORES                                    */}
        {/* ---------------------------------------------------------------- */}
        {passo === 4 && (
          <>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Convidar Moradores (Opcional)
              </CardTitle>
              <CardDescription>
                Adicione o e-mail dos moradores para gerar convites de acesso antecipados. Você também
                pode pular e convidar depois.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-5">
                  <Input
                    type="email"
                    placeholder="morador@exemplo.com"
                    value={conviteEmail}
                    onChange={(e) => setConviteEmail(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="sm:col-span-4">
                  <select
                    value={conviteUnidade}
                    onChange={(e) => setConviteUnidade(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  >
                    <option value="">Selecione a Unidade</option>
                    {listaUnidades.map((u, i) => (
                      <option key={i} value={u.identificador}>
                        {u.identificador} {u.blocoNome ? `(${u.blocoNome})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3 flex gap-2">
                  <select
                    value={conviteOcupacao}
                    onChange={(e) =>
                      setConviteOcupacao(e.target.value as "PROPRIETARIO" | "INQUILINO")
                    }
                    className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="PROPRIETARIO">Proprietário</option>
                    <option value="INQUILINO">Inquilino</option>
                  </select>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAdicionarConvite}
                className="w-full gap-1.5 h-9"
              >
                <Plus className="h-4 w-4" /> Adicionar à lista de convites
              </Button>

              {/* Lista de convites adicionados */}
              {listaConvites.length > 0 && (
                <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Moradores a serem convidados ({listaConvites.length}):
                  </p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {listaConvites.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-md border bg-card text-xs"
                      >
                        <div>
                          <span className="font-semibold">{c.email}</span>
                          <span className="text-muted-foreground ml-2">
                            ({c.unidadeIdentificador} · {c.tipoOcupacao})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoverConvite(i)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* PASSO 5: REVISÃO E CONFIRMAÇÃO                                   */}
        {/* ---------------------------------------------------------------- */}
        {passo === 5 && (
          <>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Revisão do Condomínio
              </CardTitle>
              <CardDescription>
                Confira os dados antes de finalizar. Seu período de teste de 60 dias começará
                imediatamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs text-muted-foreground">Condomínio</span>
                  <span className="text-sm font-semibold text-foreground">{condoNome}</span>
                </div>

                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs text-muted-foreground">Endereço</span>
                  <span className="text-xs font-medium text-foreground text-right truncate max-w-[280px]">
                    {condoEndereco}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs text-muted-foreground">Síndico Responsável</span>
                  <span className="text-xs font-medium text-foreground">
                    {adminNome} ({adminEmail})
                  </span>
                </div>

                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs text-muted-foreground">Total de Unidades</span>
                  <Badge variant="outline" className="font-semibold">
                    {listaUnidades.length} unidades
                  </Badge>
                </div>

                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs text-muted-foreground">Vencimento da Taxa</span>
                  <span className="text-xs font-medium text-foreground">Todo dia {condoVencimento}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Convites de Moradores</span>
                  <span className="text-xs font-medium text-foreground">
                    {listaConvites.length > 0
                      ? `${listaConvites.length} convites serão gerados`
                      : "Nenhum convite (pode convidar depois)"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-emerald-600 shrink-0" />
                <div className="text-xs text-emerald-950 dark:text-emerald-200">
                  <strong>Plano Núcleo Grátis por 60 Dias!</strong> Sem necessidade de cartão de
                  crédito para iniciar.
                </div>
              </div>
            </CardContent>
          </>
        )}

        {/* Rodapé com Navegação dos Passos */}
        <CardFooter className="flex items-center justify-between border-t bg-muted/10 p-4 sm:p-6">
          {passo > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={voltarPasso}
              disabled={isPending}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Voltar ao Login</Link>
            </Button>
          )}

          {passo < 5 ? (
            <Button type="button" size="sm" onClick={avancarPasso} className="gap-1.5">
              Continuar <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              size="default"
              onClick={handleFinalizarOnboarding}
              disabled={isPending}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md"
            >
              {isPending ? "Criando condomínio..." : "Criar Condomínio e Começar"}
              {!isPending && <CheckCircle2 className="h-4 w-4" />}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

