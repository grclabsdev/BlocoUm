import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2, ArrowRight, ShieldCheck, User } from "lucide-react";
import { getServerSession, getUserCondominios } from "@/lib/auth/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SelecionarCondominioPage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/login");
  }

  const memberships = await getUserCondominios();

  if (memberships.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>Nenhum condomínio vinculado</CardTitle>
            <CardDescription>
              Sua conta ainda não está vinculada a nenhum condomínio ativo. Peça um convite ao seu síndico.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (memberships.length === 1) {
    redirect(`/${memberships[0].condominioId}/dashboard`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-radial from-muted/50 to-background p-4 sm:p-8">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Selecione o Condomínio
          </h1>
          <p className="text-sm text-muted-foreground">
            Você possui acesso a mais de um condomínio. Escolha onde deseja atuar agora.
          </p>
        </div>

        <div className="space-y-3">
          {memberships.map((m) => (
            <Link
              key={m.condominioId}
              href={`/${m.condominioId}/dashboard`}
              className="block group"
            >
              <Card className="transition-all duration-200 hover:border-primary hover:shadow-md cursor-pointer">
                <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-base text-foreground truncate">
                        {m.condominio.nome}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {m.condominio.endereco}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="outline" className="text-xs uppercase">
                      {m.papel}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
