"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, KeyRound, Mail, ArrowRight, ShieldCheck, UserCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn } from "@/lib/auth/auth-client";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      const res = await signIn.email({
        email,
        password,
      });

      if (res.error) {
        setErro(res.error.message || "E-mail ou senha incorretos.");
        setCarregando(false);
        return;
      }

      toast.success("Login realizado com sucesso!");
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setErro("Falha de conexão. Tente novamente.");
      setCarregando(false);
    }
  }

  function preencherUsuario(e: string, p: string) {
    setEmail(e);
    setPassword(p);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-radial from-muted/60 to-background p-4 sm:p-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header com Logo */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            BlocoUm
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestão condominial inteligente, transparente e descomplicada.
          </p>
        </div>

        {/* Card do Formulário */}
        <Card className="shadow-lg border-border/80">
          <form onSubmit={handleLogin}>
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Acessar condomínio</CardTitle>
              <CardDescription>
                Informe seu e-mail e senha para entrar no sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {erro && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20">
                  {erro}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="exemplo@condominio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full gap-2" disabled={carregando}>
                {carregando ? "Entrando..." : "Entrar no sistema"}
                {!carregando && <ArrowRight className="h-4 w-4" />}
              </Button>

              <div className="text-center pt-2 border-t w-full">
                <p className="text-xs text-muted-foreground">
                  É síndico e quer gerenciar seu prédio?{" "}
                  <Link
                    href="/novo-condominio"
                    className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Criar novo condomínio
                    <Sparkles className="h-3 w-3" />
                  </Link>
                </p>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Caixa de Demonstração / Quick Login */}
        <div className="rounded-xl border bg-card/60 backdrop-blur p-4 space-y-3 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <UserCheck className="h-4 w-4 text-primary" />
            Contas de teste criadas no seed:
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                preencherUsuario("sindico@solardasacacias.com.br", "SenhaForte123!")
              }
              className="flex items-center gap-2 rounded-lg border bg-background p-2.5 text-left text-xs transition hover:border-primary cursor-pointer hover:bg-muted/50"
            >
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0 flex-1 leading-tight">
                <p className="font-medium truncate">Carlos (Síndico)</p>
                <p className="text-[10px] text-muted-foreground">Acesso Total</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                preencherUsuario("morador1@solardasacacias.com.br", "SenhaForte123!")
              }
              className="flex items-center gap-2 rounded-lg border bg-background p-2.5 text-left text-xs transition hover:border-primary cursor-pointer hover:bg-muted/50"
            >
              <Building2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <div className="min-w-0 flex-1 leading-tight">
                <p className="font-medium truncate">Ana (Moradora)</p>
                <p className="text-[10px] text-muted-foreground">Apto 101 Bloco A</p>
              </div>
            </button>
          </div>
          <p className="text-[11px] text-center text-muted-foreground">
            Senha padrão de teste: <code className="font-mono bg-muted px-1 py-0.5 rounded">SenhaForte123!</code>
          </p>
        </div>
      </div>
    </div>
  );
}
