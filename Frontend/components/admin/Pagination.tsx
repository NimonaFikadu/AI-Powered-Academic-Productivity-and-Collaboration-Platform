"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

const getPageItems = (page: number, totalPages: number) => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const items: Array<number | "ellipsis"> = [];
  const left = Math.max(2, page - 1);
  const right = Math.min(totalPages - 1, page + 1);

  items.push(1);
  if (left > 2) items.push("ellipsis");
  for (let p = left; p <= right; p++) items.push(p);
  if (right < totalPages - 1) items.push("ellipsis");
  items.push(totalPages);

  return items;
};

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  const items = React.useMemo(() => getPageItems(page, totalPages), [page, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className={cn("flex items-center justify-between gap-3 px-6 py-4 border-t bg-background", className)}>
      <div className="text-xs text-muted-foreground">
        Page <span className="font-medium text-foreground">{page}</span> of{" "}
        <span className="font-medium text-foreground">{totalPages}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          Prev
        </Button>

        <div className="hidden sm:flex items-center gap-1">
          {items.map((it, idx) =>
            it === "ellipsis" ? (
              <span key={`e-${idx}`} className="px-2 text-muted-foreground">
                ...
              </span>
            ) : (
              <Button
                key={it}
                variant={it === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(it)}
                className={cn("h-8 w-8 p-0", it === page && "bg-primaryColor hover:bg-primaryColor/90")}
              >
                {it}
              </Button>
            )
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
