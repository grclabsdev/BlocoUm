import { redirect } from "next/navigation";
import { getServerSession, getUserCondominios } from "@/lib/auth/session";

export default async function HomePage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/login");
  }

  const memberships = await getUserCondominios();

  if (memberships.length === 0) {
    redirect("/login?error=sem_condominio");
  }

  if (memberships.length === 1) {
    redirect(`/${memberships[0].condominioId}/dashboard`);
  }

  redirect("/selecionar-condominio");
}
