"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Building2, KeyRound, User, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { obterDadosConvite, aceitarConvite } from "@/server/actions/convites";
import { signIn } from "@/lib/auth/auth-client";
import { toast } from "sonner";

export default function AceitarConvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [dadosConvite, setDadosConvite] = useState<{
    email: string;
    condominioNome: string;
    condominioId: string;
    unidadeIdentificador: string;
    blocoNome?: string | null;
    tipoOcupacao: string;
  } | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [erroInicial, setErroInicial] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      const res = await obterDadosConvite(resolvedParams.token);
      if (!res.success) {
        setErroInicial(res.error || "Convite inválido.");
      } else {
        setDadosConvite(res.data || null);
      }
      setCarregando(false);
    }
    carregar();
  }, [resolvedParams.token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErroForm(null);

    if (password !== confirmPassword) {
      setErroForm("As senhas informadas não conferem.");
      return;
    }

    if (password.length < 8) {
      setErroForm("A senha deve ter no mínimo 8 caracteres.");
      return;
    }

    setSalvando(true);

    const res = await aceitarConvite({
      token: resolvedParams.token,
      nome,
      password,
    });

    if (!res.success) {
      setErroForm(res.error || "Não foi possível concluir o cadastro.");
      setSalvando(false);
      return;
    }

    toast.success("Cadastro concluído com sucesso!");

    // Realiza o login automático
    const loginRes = await signIn.email({
      email: dadosConvite!.email,
      password,
    });

    if (!loginRes.error) {
      router.push(`/${dadosConvite!.condominioId}/dashboard`);
    } else {
      router.push("/login");
    }
  }

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Validando convite de morador...</p>
        </div>
      </div>
    );
  }

  if (erroInicial || !dadosConvite) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive/30">
          <CardHeader className="text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-2" />
            <CardTitle>Convite indisponível</CardTitle>
            <CardDescription>{erroInicial}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/login")}>Ir para o login</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-radial from-muted/60 to-background p-4 sm:p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Bem-vindo ao condomínio!
          </h1>
          <p className="text-sm text-muted-foreground">
            Você foi convidado para fazer parte do{" "}
            <strong>{dadosConvite.condominioNome}</strong>.
          </p>
        </div>

        <Card className="shadow-lg">
          <form onSubmit={handleSubmit}>
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Ativar sua conta</CardTitle>
              <CardDescription>
                Unidade: <strong>{dadosConvite.unidadeIdentificador}</strong>
                {dadosConvite.blocoNome ? ` (${dadosConvite.blocoNome})` : ""} · Perfil:{" "}
                <strong>{dadosConvite.tipoOcupacao}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {erroForm && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20">
                  {erroForm}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={dadosConvite.email} disabled className="bg-muted" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome">Seu nome completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="nome"
                    placeholder="Ex: João da Silva"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Criar senha</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full gap-2" disabled={salvando}>
                {salvando ? "Ativando conta..." : "Completar cadastro e acessar"}
                {!salvando && <CheckCircle2 className="h-4 w-4" />}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
