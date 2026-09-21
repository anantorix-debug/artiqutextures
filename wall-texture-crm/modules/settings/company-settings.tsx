"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCompanyProfile, useCompanyProfileMutations } from "@/hooks/use-settings";
import { useQuotationTemplates } from "@/hooks/use-quotations";
import { fileUrl } from "@/lib/format";
import type { CompanyProfile } from "@/types/entities";

type Draft = Omit<CompanyProfile, "logoUrl" | "tftLogoUrl">;

function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={"space-y-1.5 " + (className ?? "")}>
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  return (p.length > 1 ? p[0][0] + p[1][0] : name.slice(0, 2)).toUpperCase() || "YC";
}

export function CompanySettings() {
  const { data: profile, isLoading } = useCompanyProfile();
  const { data: templates } = useQuotationTemplates();
  const { save, uploadLogo, removeLogo, uploadTftLogo, removeTftLogo } = useCompanyProfileMutations();
  const [draft, setDraft] = useState<Draft | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const tftFileRef = useRef<HTMLInputElement>(null);

  if (isLoading || !profile) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  const { logoUrl, tftLogoUrl, ...base } = profile;
  const values: Draft = draft ?? base;
  const set = <K extends keyof Draft>(key: K, v: Draft[K]) => setDraft({ ...values, [key]: v });
  const dirty = draft !== null;
  const prefix = (values.quotationPrefix || "QT").toUpperCase().replace(/[^A-Z0-9]/g, "");

  function onLogo(file?: File) {
    if (!file) return;
    if (!/\.(png|jpe?g)$/i.test(file.name)) {
      toast.error("Logo must be a PNG or JPG image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo must be under 5 MB");
      return;
    }
    uploadLogo.mutate(file);
  }

  function onTftLogo(file?: File) {
    if (!file) return;
    if (!/\.(png|jpe?g)$/i.test(file.name)) {
      toast.error("Logo must be a PNG or JPG image");
      return;
    }
    uploadTftLogo.mutate(file);
  }

  function onSave() {
    save.mutate(
      {
        ...values,
        defaultValidityDays: Number(values.defaultValidityDays) || 15,
        defaultAdvancePercent: Number(values.defaultAdvancePercent) || 0,
      },
      { onSuccess: () => setDraft(null) },
    );
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Company logo</CardTitle>
          <CardDescription>
            Upload once — it appears automatically on quotation previews, PDFs, prints and WhatsApp copies.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-24 w-48 shrink-0 items-center justify-center rounded-lg border bg-muted/40 p-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fileUrl(logoUrl)} alt="Company logo" className="max-h-full max-w-full object-contain" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-md bg-foreground text-lg font-bold text-background">
                {initials(values.companyName)}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {logoUrl ? "Current logo." : "No logo yet — a neutral placeholder is used on documents until you upload one."}{" "}
              PNG or JPG, ideally on a transparent or white background.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={uploadLogo.isPending} onClick={() => fileRef.current?.click()}>
                <ImagePlus className="h-4 w-4" /> {uploadLogo.isPending ? "Uploading…" : logoUrl ? "Replace logo" : "Upload logo"}
              </Button>
              {logoUrl && (
                <Button variant="ghost" className="text-destructive" disabled={removeLogo.isPending} onClick={() => removeLogo.mutate()}>
                  <Trash2 className="h-4 w-4" /> Remove
                </Button>
              )}
              <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => { onLogo(e.target.files?.[0]); e.target.value = ""; }} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Company details</CardTitle>
          <CardDescription>Shown in the header and footer of every quotation.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Company name">
            <Input value={values.companyName} onChange={(e) => set("companyName", e.target.value)} />
          </Field>
          <Field label="Tagline">
            <Input value={values.tagline} onChange={(e) => set("tagline", e.target.value)} />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <Textarea rows={2} value={values.address} onChange={(e) => set("address", e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input value={values.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" value={values.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Website">
            <Input value={values.website} onChange={(e) => set("website", e.target.value)} />
          </Field>
          <Field label="GST / tax number" hint="Leave blank if not applicable.">
            <Input value={values.gstNumber} maxLength={30} onChange={(e) => set("gstNumber", e.target.value.toUpperCase())} />
          </Field>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Second brand — Time For Texture</CardTitle>
          <CardDescription>
            A separate company. Quotations that use the “Time For Texture” template show these details and logo instead of the main company.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-20 w-40 shrink-0 items-center justify-center rounded-lg border bg-muted/40 p-2">
              {tftLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fileUrl(tftLogoUrl)} alt="Time For Texture logo" className="max-h-full max-w-full object-contain" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-md bg-orange-700 text-base font-bold text-white">
                  {initials(values.tftName)}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={uploadTftLogo.isPending} onClick={() => tftFileRef.current?.click()}>
                <ImagePlus className="h-4 w-4" /> {uploadTftLogo.isPending ? "Uploading…" : tftLogoUrl ? "Replace logo" : "Upload logo"}
              </Button>
              {tftLogoUrl && (
                <Button variant="ghost" className="text-destructive" disabled={removeTftLogo.isPending} onClick={() => removeTftLogo.mutate()}>
                  <Trash2 className="h-4 w-4" /> Remove
                </Button>
              )}
              <input ref={tftFileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => { onTftLogo(e.target.files?.[0]); e.target.value = ""; }} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Brand / company name">
              <Input value={values.tftName} onChange={(e) => set("tftName", e.target.value)} />
            </Field>
            <Field label="Tagline">
              <Input value={values.tftTagline} onChange={(e) => set("tftTagline", e.target.value)} />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <Textarea rows={2} value={values.tftAddress} onChange={(e) => set("tftAddress", e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={values.tftPhone} onChange={(e) => set("tftPhone", e.target.value)} />
            </Field>
            <Field label="Email">
              <Input type="email" value={values.tftEmail} onChange={(e) => set("tftEmail", e.target.value)} />
            </Field>
            <Field label="Website">
              <Input value={values.tftWebsite} onChange={(e) => set("tftWebsite", e.target.value)} />
            </Field>
            <Field label="GST / tax number">
              <Input value={values.tftGstNumber} maxLength={30} onChange={(e) => set("tftGstNumber", e.target.value.toUpperCase())} />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Quotation defaults</CardTitle>
          <CardDescription>Applied to every new quotation — each one can still be edited individually.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Numbering prefix" hint={`Next quotation numbers look like ${prefix}-${new Date().getFullYear()}-0001`}>
            <Input value={values.quotationPrefix} maxLength={8} onChange={(e) => set("quotationPrefix", e.target.value.replace(/[^A-Za-z0-9]/g, ""))} />
          </Field>
          <Field label="Default template">
            <Select value={values.defaultTemplateCode} onValueChange={(v) => v && set("defaultTemplateCode", v)}>
              <SelectTrigger className="w-full">
                <SelectValue>{templates?.find((t) => t.code === values.defaultTemplateCode)?.name ?? values.defaultTemplateCode}</SelectValue>
              </SelectTrigger>
              <SelectContent align="end" alignItemWithTrigger={false}>
                {(templates ?? []).map((t) => (
                  <SelectItem key={t.id} value={t.code}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Validity (days)" hint="Default “valid until” date on new quotations.">
            <Input type="number" min={1} max={365} value={values.defaultValidityDays} onChange={(e) => set("defaultValidityDays", Number(e.target.value))} />
          </Field>
          <Field label="Advance required (%)" hint="Pre-filled advance as a share of the grand total.">
            <Input type="number" min={0} max={100} value={values.defaultAdvancePercent} onChange={(e) => set("defaultAdvancePercent", Number(e.target.value))} />
          </Field>
          <Field label="Default terms & conditions" className="sm:col-span-2" hint="One term per line.">
            <Textarea rows={6} value={values.defaultTerms} onChange={(e) => set("defaultTerms", e.target.value)} />
          </Field>
          <Field label="Default notes" className="sm:col-span-2">
            <Textarea rows={3} value={values.defaultNotes} onChange={(e) => set("defaultNotes", e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <div className="sticky bottom-3 z-10 flex items-center justify-end gap-2 rounded-xl border bg-background/95 p-3 shadow-md backdrop-blur">
        {dirty && <span className="mr-auto text-xs text-muted-foreground">You have unsaved changes</span>}
        {dirty && (
          <Button variant="outline" onClick={() => setDraft(null)}>Discard</Button>
        )}
        <Button disabled={!dirty || save.isPending} onClick={onSave}>
          {save.isPending ? "Saving…" : "Save company settings"}
        </Button>
      </div>
    </div>
  );
}
