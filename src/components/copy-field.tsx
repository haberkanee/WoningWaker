"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

export function CopyField({ value }: { value: string }) {
  const [gekopieerd, setGekopieerd] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 overflow-x-auto rounded-md border bg-muted px-3 py-2 text-sm">
        {value}
      </code>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setGekopieerd(true);
            setTimeout(() => setGekopieerd(false), 1500);
          } catch {
            /* ignore */
          }
        }}
        aria-label="Kopieer"
      >
        {gekopieerd ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}
