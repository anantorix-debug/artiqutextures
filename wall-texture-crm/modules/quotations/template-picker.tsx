"use client";

import { useState } from "react";
import { Check, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCompanyProfile } from "@/hooks/use-settings";
import { QuotationSheet, ScaledSheet, type SheetTheme } from "./quotation-sheet";
import type { CompanyProfile, QuotationTemplate } from "@/types/entities";

const isTft = (code: string) => code === "TIME_FOR_TEXTURE" || code.startsWith("TFT_");

const GROUPS = [
  { title: "Artiqu Surface", hint: "main company", match: (c: string) => !isTft(c) },
  { title: "Time For Texture", hint: "separate brand — own name, details & logo", match: isTft },
];

/** "Time For Texture" is a separate brand: it previews with its own name, contacts and logo. */
function brandFor(code: string, c: CompanyProfile | undefined): CompanyProfile | null {
  if (!c) return null;
  if (!isTft(code)) return c;
  return {
    ...c,
    companyName: c.tftName,
    tagline: c.tftTagline,
    address: c.tftAddress,
    phone: c.tftPhone,
    email: c.tftEmail,
    website: c.tftWebsite,
    gstNumber: c.tftGstNumber,
    logoUrl: c.tftLogoUrl,
  };
}

/**
 * Template gallery: every card is a realistic miniature of the actual quotation
 * (company block, customer, item table, totals, terms, signatures) using the
 * company details and logo from Settings.
 */
export function TemplatePicker({
  templates,
  value,
  onChange,
  disabled,
}: {
  templates: QuotationTemplate[];
  value?: string;
  onChange: (code: string) => void;
  disabled?: boolean;
}) {
  const { data: company } = useCompanyProfile();
  const [enlarged, setEnlarged] = useState<QuotationTemplate | null>(null);

  return (
    <>
      {GROUPS.map((group) => {
        const items = templates.filter((t) => group.match(t.code));
        if (items.length === 0) return null;
        return (
      <section key={group.title} className="mb-6 last:mb-0">
        <div className="mb-2 flex items-baseline gap-2">
          <h3 className="text-sm font-semibold">{group.title}</h3>
          <span className="text-xs text-muted-foreground">{group.hint}</span>
        </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-4">
        {items.map((t) => {
          const active = value === t.code;
          return (
            <div
              key={t.id}
              className={cn(
                "group relative flex w-[78%] shrink-0 snap-center flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all sm:w-auto sm:shrink",
                active ? "border-foreground ring-2 ring-foreground" : "hover:border-foreground/40 hover:shadow-md",
                disabled && "opacity-60",
              )}
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(t.code)}
                aria-pressed={active}
                aria-label={`Use the ${t.name} template`}
                className="block w-full bg-muted/60 p-3 text-left disabled:cursor-not-allowed"
              >
                <div className="pointer-events-none overflow-hidden rounded-md bg-white shadow-md ring-1 ring-black/5">
                  <ScaledSheet>
                    <QuotationSheet theme={t.code as SheetTheme} company={brandFor(t.code, company)} />
                  </ScaledSheet>
                </div>
              </button>

              {active && (
                <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background shadow">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}

              <div className="flex items-start justify-between gap-2 border-t px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
                </div>
                <Button type="button" size="icon-sm" variant="ghost" aria-label={`Enlarge ${t.name}`} onClick={() => setEnlarged(t)}>
                  <Maximize2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      </section>
        );
      })}

      <Dialog open={!!enlarged} onOpenChange={(o) => !o && setEnlarged(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[min(48rem,calc(100%-2rem))]">
          <DialogHeader>
            <DialogTitle>{enlarged?.name}</DialogTitle>
            <DialogDescription>Sample content — your company details come from Settings.</DialogDescription>
          </DialogHeader>
          {enlarged && (
            <div className="overflow-hidden rounded-md border bg-white shadow-sm">
              <ScaledSheet>
                <QuotationSheet theme={enlarged.code as SheetTheme} company={brandFor(enlarged.code, company)} />
              </ScaledSheet>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEnlarged(null)}>
              Close
            </Button>
            <Button
              type="button"
              disabled={disabled}
              onClick={() => {
                if (enlarged) onChange(enlarged.code);
                setEnlarged(null);
              }}
            >
              Use this template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
