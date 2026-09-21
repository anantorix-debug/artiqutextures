"use client";

import { useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TestimonialFormDialog } from "@/modules/testimonials/testimonial-form-dialog";
import { useDeleteTestimonial, useTestimonials } from "@/hooks/use-testimonials";
import { API_BASE_URL } from "@/lib/api-client";

function fileUrl(path: string) {
  return `${API_BASE_URL.replace(/\/api$/, "")}${path}`;
}

export default function TestimonialsPage() {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const { data, isLoading } = useTestimonials({ page: 1, limit: 60, sortBy: "sortOrder", sortOrder: "asc" });
  const deleteTestimonial = useDeleteTestimonial();

  return (
    <div>
      <PageHeader
        title="Testimonials"
        description="Customer quotes shown on the public website"
        actions={<TestimonialFormDialog />}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No testimonials yet. Add your first one — it will appear on the public website once published.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.items.map((t) => (
            <Card key={t.id} className="shadow-sm">
              <CardContent className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {t.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={fileUrl(t.avatarUrl)} alt={t.customerName} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
                        {t.customerName.slice(0, 1)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{t.customerName}</p>
                      {t.role && <p className="text-xs text-muted-foreground">{t.role}</p>}
                    </div>
                  </div>
                  {t.isFeatured && (
                    <Badge className="gap-1 border-0 bg-amber-500/90 text-white">
                      <Star className="h-3 w-3 fill-current" /> Featured
                    </Badge>
                  )}
                </div>

                <p className="mt-3 flex-1 text-sm text-muted-foreground">&ldquo;{t.quote}&rdquo;</p>

                {t.rating && (
                  <div className="mt-3 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${i < t.rating! ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                      />
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <Badge variant="outline" className="text-xs">{t.status}</Badge>
                  <div className="flex gap-1">
                    <TestimonialFormDialog testimonial={t} />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive"
                      onClick={() => setDeleteTarget(t.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this testimonial?"
        destructive
        confirmLabel="Delete"
        loading={deleteTestimonial.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteTestimonial.mutate(deleteTarget, { onSuccess: () => setDeleteTarget(null) });
        }}
      />
    </div>
  );
}
