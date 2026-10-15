import * as React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Ocorreu um problema",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center animate-in fade-in-50">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15 text-destructive">
        <AlertCircle className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          className="mt-5 gap-2 border-destructive/30 hover:bg-destructive/10"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
