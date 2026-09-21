"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings, useUpsertSettings } from "@/hooks/use-settings";
import type { SettingCategory } from "@/types/enums";

export interface SettingFieldDef {
  key: string;
  label: string;
  type?: "text" | "password" | "number" | "boolean";
  placeholder?: string;
  isSecret?: boolean;
  /** Only used for type "boolean" — the toggle state when no value has been saved yet. */
  defaultValue?: boolean;
}

export function SettingsForm({ category, fields }: { category: SettingCategory; fields: SettingFieldDef[] }) {
  const { data, isLoading } = useSettings(category);
  const upsert = useUpsertSettings(category);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!data) return;
    const map: Record<string, string> = {};
    for (const field of fields) {
      const found = data.find((d) => d.key === field.key);
      if (found?.value !== undefined && found.value !== null && found.value !== "") {
        map[field.key] = found.value;
      } else if (field.type === "boolean") {
        map[field.key] = String(field.defaultValue ?? true);
      } else {
        map[field.key] = "";
      }
    }
    setValues(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  function handleSave() {
    upsert.mutate(
      fields
        .filter((f) => values[f.key] !== undefined && values[f.key] !== "")
        .map((f) => ({ key: f.key, value: values[f.key], isSecret: f.isSecret })),
    );
  }

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="space-y-3">
          {fields.map((f) => (
            <Skeleton key={f.key} className="h-9 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((field) => {
            const hasStoredSecret = field.isSecret && data?.find((d) => d.key === field.key)?.hasValue;

            if (field.type === "boolean") {
              return (
                <div
                  key={field.key}
                  className="flex items-center justify-between rounded-lg border p-3 sm:col-span-1"
                >
                  <Label className="!mt-0">{field.label}</Label>
                  <Switch
                    checked={values[field.key] !== "false"}
                    onCheckedChange={(checked) =>
                      setValues((v) => ({ ...v, [field.key]: String(checked) }))
                    }
                  />
                </div>
              );
            }

            return (
              <div key={field.key} className="space-y-1.5">
                <Label>{field.label}</Label>
                <Input
                  type={field.type ?? "text"}
                  placeholder={hasStoredSecret ? "•••••••• (set — leave blank to keep)" : field.placeholder}
                  value={values[field.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                />
              </div>
            );
          })}
        </div>
        <Button onClick={handleSave} disabled={upsert.isPending}>
          {upsert.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
