"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

export function CopyBlock({ value, taal = "code" }: { value: string; taal?: string }) {
  const [gekopieerd, setGekopieerd] = useState(false);
  return (
    <div className="relative">
      <pre className="max-h-72 overflow-auto rounded-md border bg-muted p-3 text-xs leading-relaxed">
        <code>{value}</code>
      </pre>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="absolute right-2 top-2"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setGekopieerd(true);
            setTimeout(() => setGekopieerd(false), 1500);
          } catch {
            /* ignore */
          }
        }}
      >
        {gekopieerd ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
        {gekopieerd ? "Gekopieerd" : "Kopieer"}
      </Button>
      <span className="sr-only">{taal}</span>
    </div>
  );
}
