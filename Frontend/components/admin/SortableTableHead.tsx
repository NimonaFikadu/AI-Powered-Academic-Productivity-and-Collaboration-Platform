"use client";

import * as React from "react";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { TableHead } from "@/components/ui/table";

type SortDir = "ASC" | "DESC";

type SortableTableHeadProps = {
  label: string;
  sortKey: string;
  activeSortBy: string;
  activeSortDir: SortDir;
  onSortChange: (sortBy: string, sortDir: SortDir) => void;
  className?: string;
};

export function SortableTableHead({
  label,
  sortKey,
  activeSortBy,
  activeSortDir,
  onSortChange,
  className,
}: SortableTableHeadProps) {
  const isActive = activeSortBy === sortKey;

  const nextDir: SortDir = isActive && activeSortDir === "DESC" ? "ASC" : "DESC";

  return (
    <TableHead
      className={cn("select-none", className)}
      onClick={() => onSortChange(sortKey, nextDir)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSortChange(sortKey, nextDir);
        }
      }}
    >
      <span className={cn("inline-flex items-center gap-2", "cursor-pointer")}
        aria-label={`Sort by ${label}`}
      >
        {label}
        <ArrowUpDown className={cn("h-4 w-4 text-muted-foreground", isActive && "text-foreground")} />
      </span>
    </TableHead>
  );
}
