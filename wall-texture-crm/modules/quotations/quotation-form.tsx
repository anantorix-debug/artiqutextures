"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CustomerPicker } from "./customer-picker";
import { TemplatePicker } from "./template-picker";
import { useQuotationTemplates } from "@/hooks/use-quotations";
import { useCompanyProfile } from "@/hooks/use-settings";
import { formatCurrency, toInputDate } from "@/lib/format";
import type { Customer, Quotation } from "@/types/entities";
import { DiscountType, QuotationTemplateCode } from "@/types/enums";
import type { QuotationFormValues } from "@/services/quotation.service";

const itemSchema = z.object({
  productName: z.string().min(1, "Required"),
  description: z.string().optional(),
  measurement: z.string().optional(),
  sqft: z.coerce.number().min(0.01, "Required"),
  rate: z.coerce.number().min(0, "Required"),
});

const schema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  projectName: z.string().min(1, "Required"),
  templateCode: z.string(),
  quotationDate: z.string().optional(),
  validUntil: z.string().optional(),
  items: z.array(itemSchema).min(1, "Add at least one item"),
  discountType: z.string(),
  discountValue: z.coerce.number().min(0),
  gstEnabled: z.boolean(),
  gstPercentage: z.coerce.number().min(0).max(100),
  transportationCharges: z.coerce.number().min(0),
  installationCharges: z.coerce.number().min(0),
  additionalCharges: z.coerce.number().min(0),
  advanceRequired: z.string().optional(),
  termsConditions: z.string().optional(),
  notes: z.string().optional(),
});

export type QuotationFormSchema = z.infer<typeof schema>;

function defaultValues(quotation?: Quotation & { items?: import("@/types/entities").QuotationItem[] }): QuotationFormSchema {
  return {
    customerId: quotation?.customerId ?? "",
    projectName: quotation?.projectName ?? "",
    templateCode: quotation?.template?.code ?? QuotationTemplateCode.TIME_FOR_TEXTURE,
    quotationDate: toInputDate(quotation?.quotationDate) || toInputDate(new Date().toISOString()),
    validUntil: toInputDate(quotation?.validUntil),
    items: quotation?.items?.length
      ? quotation.items.map((i) => ({
          productName: i.productName,
          description: i.description ?? "",
          measurement: i.measurement ?? "",
          sqft: Number(i.sqft),
          rate: Number(i.rate),
        }))
      : [{ productName: "", description: "", measurement: "", sqft: 0, rate: 0 }],
    discountType: quotation?.discountType ?? DiscountType.PERCENTAGE,
    discountValue: Number(quotation?.discountValue ?? 0),
    gstEnabled: quotation?.gstEnabled ?? false,
    gstPercentage: Number(quotation?.gstPercentage ?? 18),
    transportationCharges: Number(quotation?.transportationCharges ?? 0),
    installationCharges: Number(quotation?.installationCharges ?? 0),
    additionalCharges: Number(quotation?.additionalCharges ?? 0),
    advanceRequired: quotation ? String(Number(quotation.advanceRequired ?? 0)) : "",
    termsConditions: quotation?.termsConditions ?? "",
    notes: quotation?.notes ?? "",
  };
}

export function QuotationForm({
  initialCustomer,
  quotation,
  onSubmit,
  submitLabel = "Create Quotation",
  submitting,
}: {
  initialCustomer?: Customer | null;
  quotation?: Quotation & { items?: import("@/types/entities").QuotationItem[] };
  onSubmit: (values: QuotationFormValues) => void;
  submitLabel?: string;
  submitting?: boolean;
}) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    initialCustomer ?? quotation?.customer ?? null,
  );
  const { data: templates } = useQuotationTemplates();
  const { data: profile } = useCompanyProfile();

  const form = useForm<QuotationFormSchema>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues(quotation),
  });

  useEffect(() => {
    if (initialCustomer) {
      setSelectedCustomer(initialCustomer);
      form.setValue("customerId", initialCustomer.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCustomer]);

  // New quotation: pre-fill template, validity, terms and notes from Settings (once, without overriding edits).
  useEffect(() => {
    if (quotation || !profile) return;
    const { dirtyFields } = form.formState;
    if (!dirtyFields.templateCode) form.setValue("templateCode", profile.defaultTemplateCode);
    if (!dirtyFields.termsConditions && !form.getValues("termsConditions")) form.setValue("termsConditions", profile.defaultTerms);
    if (!dirtyFields.notes && !form.getValues("notes")) form.setValue("notes", profile.defaultNotes);
    if (!form.getValues("validUntil")) {
      const d = new Date();
      d.setDate(d.getDate() + profile.defaultValidityDays);
      form.setValue("validUntil", d.toISOString().slice(0, 10));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, quotation]);

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });
  const items = form.watch("items");
  const discountType = form.watch("discountType");
  const discountValue = form.watch("discountValue");
  const gstEnabled = form.watch("gstEnabled");
  const gstPercentage = form.watch("gstPercentage");
  const transportationCharges = form.watch("transportationCharges");
  const installationCharges = form.watch("installationCharges");
  const additionalCharges = form.watch("additionalCharges");

  const totals = useMemo(() => {
    const subTotal = items.reduce((sum, i) => sum + (Number(i.sqft) || 0) * (Number(i.rate) || 0), 0);
    const discountAmount =
      discountType === "PERCENTAGE" ? (subTotal * (Number(discountValue) || 0)) / 100 : Number(discountValue) || 0;
    const afterDiscount = subTotal - discountAmount;
    const gstAmount = gstEnabled ? (afterDiscount * (Number(gstPercentage) || 0)) / 100 : 0;
    const grandTotal =
      afterDiscount + gstAmount + (Number(transportationCharges) || 0) + (Number(installationCharges) || 0) + (Number(additionalCharges) || 0);
    return { subTotal, discountAmount, gstAmount, grandTotal };
  }, [items, discountType, discountValue, gstEnabled, gstPercentage, transportationCharges, installationCharges, additionalCharges]);

  function handleSubmit(values: QuotationFormSchema) {
    onSubmit({
      ...values,
      advanceRequired: values.advanceRequired === undefined || values.advanceRequired === "" ? undefined : Number(values.advanceRequired),
      templateCode: values.templateCode as never,
      discountType: values.discountType as never,
      quotationDate: values.quotationDate || undefined,
      validUntil: values.validUntil || undefined,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">1 · Choose a quotation template</CardTitle>
            <p className="text-xs text-muted-foreground">
              Previews use your company details and logo from Settings. You can switch the template any time before sending.
            </p>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="templateCode"
              render={({ field }) => (
                <FormItem>
                  <TemplatePicker templates={templates ?? []} value={field.value} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">2 · Customer & Project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="customerId"
              render={() => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <CustomerPicker
                    value={selectedCustomer}
                    disabled={!!quotation}
                    onSelect={(c) => {
                      setSelectedCustomer(c);
                      form.setValue("customerId", c.id, { shouldValidate: true });
                    }}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="projectName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Living Room 3D Wall Texture" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="quotationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quotation Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="validUntil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid Until</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Products / Items</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ productName: "", description: "", measurement: "", sqft: 0, rate: 0 })}
            >
              <Plus className="h-4 w-4" /> Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => {
              const amount = (Number(items[index]?.sqft) || 0) * (Number(items[index]?.rate) || 0);
              return (
                <div key={field.id} className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Item {index + 1}</span>
                    {fields.length > 1 && (
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(index)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
                    <div className="col-span-2 sm:col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.productName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Product / Texture</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <FormField
                        control={form.control}
                        name={`items.${index}.measurement`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Measurement</FormLabel>
                            <FormControl>
                              <Input placeholder="12ft x 10ft" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name={`items.${index}.sqft`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Sq.ft</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.rate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Rate</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div>
                      <FormLabel className="text-xs">Amount</FormLabel>
                      <p className="mt-1 flex h-8 items-center text-sm font-medium">{formatCurrency(amount)}</p>
                    </div>
                  </div>
                  <FormField
                    control={form.control}
                    name={`items.${index}.description`}
                    render={({ field }) => (
                      <FormItem className="mt-3">
                        <FormLabel className="text-xs">Description (optional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              );
            })}
            {form.formState.errors.items?.message && (
              <p className="text-sm text-destructive">{form.formState.errors.items.message}</p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Charges & Discount</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="discountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Type</FormLabel>
                      <Select value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                          <SelectItem value="FIXED">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discountValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Value</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="gstEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <FormLabel className="!mt-0">Apply GST</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              {gstEnabled && (
                <FormField
                  control={form.control}
                  name="gstPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST %</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="transportationCharges"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transportation</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="installationCharges"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Installation</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="additionalCharges"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="advanceRequired"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Advance required (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        inputMode="decimal"
                        placeholder={profile ? `Default: ${profile.defaultAdvancePercent}% of grand total` : "Amount"}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Shown on the quotation and tracked under Payments once approved.</p>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="termsConditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terms & Conditions</FormLabel>
                    <FormControl>
                      <Textarea rows={4} placeholder="Defaults come from Settings → Company" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="h-fit shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sub Total</span>
                <span>{formatCurrency(totals.subTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>- {formatCurrency(totals.discountAmount)}</span>
              </div>
              {gstEnabled && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST ({gstPercentage}%)</span>
                  <span>{formatCurrency(totals.gstAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transportation</span>
                <span>{formatCurrency(transportationCharges)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Installation</span>
                <span>{formatCurrency(installationCharges)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Additional</span>
                <span>{formatCurrency(additionalCharges)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t pt-2 text-base font-semibold">
                <span>Grand Total</span>
                <span>{formatCurrency(totals.grandTotal)}</span>
              </div>

              <Button type="submit" className="mt-4 w-full" disabled={submitting}>
                {submitting ? "Saving..." : submitLabel}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </Form>
  );
}
