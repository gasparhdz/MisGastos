import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SummaryCardProps = {
  title: string;
  value: string;
  icon: ReactNode;
  tone: "primary" | "soft" | "warning" | "positive" | "done";
};

export function SummaryCard({ title, value, icon, tone }: SummaryCardProps) {
  return (
    <Card
      className={cn(
        "shadow-none",
        tone === "primary" && "border-primary/20 bg-primary text-primary-foreground",
        tone === "soft" && "bg-accent/60",
        tone === "warning" && "border-amber-200 bg-amber-50 text-amber-950",
        tone === "positive" && "border-emerald-200 bg-emerald-50 text-emerald-950",
        tone === "done" && "bg-muted/70",
      )}
    >
      <CardContent className="flex min-h-28 flex-col justify-between p-4">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              "max-w-28 text-xs font-semibold leading-snug",
              tone === "primary" ? "text-primary-foreground/80" : "text-muted-foreground",
            )}
          >
            {title}
          </p>
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full",
              tone === "primary" ? "bg-white/15" : "bg-background/80",
            )}
          >
            {icon}
          </span>
        </div>
        <p className="mt-4 text-xl font-bold tracking-normal">{value}</p>
      </CardContent>
    </Card>
  );
}
