"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Plus, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCreateTestimonial, useUpdateTestimonial } from "@/hooks/use-testimonials";
import type { Testimonial } from "@/types/entities";

const schema = z.object({
  customerName: z.string().min(1, "Required"),
  role: z.string().optional(),
  quote: z.string().min(1, "Required"),
  rating: z.string().optional(),
  isFeatured: z.boolean(),
});
type Values = z.infer<typeof schema>;

export function TestimonialFormDialog({ testimonial }: { testimonial?: Testimonial }) {
  const isEdit = !!testimonial;
  const [open, setOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const createTestimonial = useCreateTestimonial();
  const updateTestimonial = useUpdateTestimonial();
  const pending = createTestimonial.isPending || updateTestimonial.isPending;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: testimonial?.customerName ?? "",
      role: testimonial?.role ?? "",
      quote: testimonial?.quote ?? "",
      rating: testimonial?.rating ? String(testimonial.rating) : "5",
      isFeatured: testimonial?.isFeatured ?? false,
    },
  });

  function onSubmit(values: Values) {
    const payload = {
      customerName: values.customerName,
      role: values.role || undefined,
      quote: values.quote,
      rating: values.rating ? Number(values.rating) : undefined,
      isFeatured: values.isFeatured,
    };

    const onSuccess = () => {
      setOpen(false);
      if (!isEdit) {
        form.reset({ customerName: "", role: "", quote: "", rating: "5", isFeatured: false });
        setAvatarFile(null);
      }
    };

    if (isEdit) {
      updateTestimonial.mutate({ id: testimonial.id, payload, avatar: avatarFile ?? undefined }, { onSuccess });
    } else {
      createTestimonial.mutate({ payload, avatar: avatarFile ?? undefined }, { onSuccess });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="ghost" size="icon-sm">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button>
              <Plus className="h-4 w-4" /> Add Testimonial
            </Button>
          )
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Testimonial" : "Add Testimonial"}</DialogTitle>
          <DialogDescription>Shown on the public website — powers the &ldquo;What clients say&rdquo; section</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Photo (optional)</Label>
              <Input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} />
            </div>
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attribution</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Neelankarai villa, 2025" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quote</FormLabel>
                  <FormControl>
                    <Textarea rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating</FormLabel>
                  <Select value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Rating" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[5, 4, 3, 2, 1].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} star{n === 1 ? "" : "s"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isFeatured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <FormLabel className="!mt-0">Featured</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : isEdit ? "Save changes" : "Add Testimonial"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
