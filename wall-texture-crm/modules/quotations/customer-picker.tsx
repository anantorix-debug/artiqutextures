"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCustomers } from "@/hooks/use-customers";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { LeadFormDialog } from "@/modules/leads/lead-form-dialog";
import type { Customer } from "@/types/entities";

export function CustomerPicker({
  value,
  onSelect,
  disabled,
}: {
  value?: Customer | null;
  onSelect: (customer: Customer) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading } = useCustomers({ page: 1, limit: 20, search: debouncedSearch || undefined });

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className="w-full justify-between font-normal"
            >
              {value ? (
                <span className="truncate">
                  {value.customerName} <span className="text-muted-foreground">· {value.phone}</span>
                </span>
              ) : (
                <span className="text-muted-foreground">Select a customer...</span>
              )}
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          }
        />
        <PopoverContent className="w-[--anchor-width] p-0" align="start">
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, city..."
              className="h-7 border-0 px-0 shadow-none focus-visible:ring-0"
              autoFocus
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <p className="p-4 text-center text-sm text-muted-foreground">Searching...</p>
            ) : data?.items.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">No customers found</p>
            ) : (
              <div className="p-1">
                {data?.items.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onSelect(c);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-muted",
                      value?.id === c.id && "bg-muted",
                    )}
                  >
                    <span className="min-w-0 truncate">
                      <span className="font-medium">{c.customerName}</span>{" "}
                      <span className="text-muted-foreground">· {c.phone}</span>
                    </span>
                    {value?.id === c.id && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="border-t p-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setCreateOpen(true);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm font-medium text-foreground hover:bg-muted"
            >
              <UserPlus className="h-4 w-4" /> Add New Customer
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <LeadFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(customer) => onSelect(customer)}
      />
    </>
  );
}
