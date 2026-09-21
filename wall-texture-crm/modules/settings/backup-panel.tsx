"use client";

import { useState } from "react";
import { Database, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { useBackups, useDownloadBackup, useRunBackup } from "@/hooks/use-settings";
import { formatDateTime } from "@/lib/format";

function formatSize(bytes?: string | null) {
  if (!bytes) return "-";
  const n = Number(bytes);
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export function BackupPanel() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useBackups({ page, limit: 10 });
  const runBackup = useRunBackup();
  const downloadBackup = useDownloadBackup();

  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Database Backup</p>
            <p className="text-xs text-muted-foreground">Runs mysqldump against the configured database</p>
          </div>
          <Button onClick={() => runBackup.mutate()} disabled={runBackup.isPending}>
            <Database className="h-4 w-4" /> {runBackup.isPending ? "Running..." : "Run Backup Now"}
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading backup history...</p>
        ) : data?.items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No backups have been run yet</p>
        ) : (
          <ul className="divide-y">
            {data?.items.map((backup) => (
              <li key={backup.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium">{backup.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(backup.createdAt)} · {formatSize(backup.fileSize)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={backup.status} />
                  {backup.status === "SUCCESS" && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => downloadBackup.mutate({ id: backup.id, fileName: backup.fileName })}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {data?.meta && data.meta.totalPages > 1 && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" disabled={!data.meta.hasPrevPage} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={!data.meta.hasNextPage} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
