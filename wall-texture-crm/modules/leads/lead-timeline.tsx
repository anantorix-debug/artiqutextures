"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Phone, Mail, MessageCircle, MapPin, RefreshCcw, FileText, Users, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useAddActivity } from "@/hooks/use-customers";
import { formatDateTime } from "@/lib/format";
import type { CustomerActivity } from "@/types/entities";
import { ActivityType } from "@/types/enums";

const ICONS: Record<string, typeof Phone> = {
  CALL: Phone,
  EMAIL: Mail,
  WHATSAPP: MessageCircle,
  SITE_VISIT: MapPin,
  STATUS_CHANGE: RefreshCcw,
  QUOTATION: FileText,
  MEETING: Users,
  FOLLOW_UP: StickyNote,
  NOTE: StickyNote,
  OTHER: StickyNote,
};

const schema = z.object({
  type: z.string(),
  title: z.string().min(1, "Required"),
  description: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export function LeadTimeline({ customerId, activities }: { customerId: string; activities: CustomerActivity[] }) {
  const [open, setOpen] = useState(false);
  const addActivity = useAddActivity(customerId);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { type: ActivityType.NOTE, title: "", description: "" },
  });

  function onSubmit(values: Values) {
    addActivity.mutate(values, {
      onSuccess: () => {
        form.reset({ type: ActivityType.NOTE, title: "", description: "" });
        setOpen(false);
      },
    });
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardContent>
          {!open ? (
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
              <StickyNote className="h-4 w-4" /> Add note / call / follow-up
            </Button>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <div className="flex gap-2">
                <Select
                  value={form.watch("type")}
                  onValueChange={(v) => v && form.setValue("type", v)}
                >
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.values(ActivityType).map((t) => (
                      <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input
                  className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  placeholder="Title, e.g. Called customer to confirm site visit"
                  {...form.register("title")}
                />
              </div>
              <Textarea rows={2} placeholder="Details (optional)" {...form.register("description")} />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={addActivity.isPending}>
                  {addActivity.isPending ? "Saving..." : "Save"}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent>
          {activities.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No activity yet</p>
          ) : (
            <ol className="relative space-y-6 border-l pl-5">
              {activities.map((activity) => {
                const Icon = ICONS[activity.type] ?? StickyNote;
                return (
                  <li key={activity.id} className="relative">
                    <span className="absolute -left-[27px] flex h-6 w-6 items-center justify-center rounded-full bg-muted ring-4 ring-card">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                    <p className="text-sm font-medium">{activity.title}</p>
                    {activity.description && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{activity.description}</p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(activity.activityDate)}</p>
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
