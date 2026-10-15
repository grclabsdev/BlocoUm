import { Skeleton } from "@/components/ui/skeleton";

export default function DocumentosLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
