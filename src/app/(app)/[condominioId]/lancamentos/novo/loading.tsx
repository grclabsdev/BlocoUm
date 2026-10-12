import { Skeleton } from "@/components/ui/skeleton";

export default function NovoLancamentoLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Skeleton className="h-8 w-44" />
      <Skeleton className="h-[480px] rounded-xl" />
    </div>
  );
}
