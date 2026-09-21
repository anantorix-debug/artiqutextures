"use client";

import { QrCode, Smartphone, Power, PlugZap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { useInitializeWhatsapp, useLogoutWhatsapp, useWhatsappStatus } from "@/hooks/use-whatsapp";

export function ConnectionPanel() {
  const { data: status, isLoading } = useWhatsappStatus();
  const initialize = useInitializeWhatsapp();
  const logout = useLogoutWhatsapp();

  return (
    <Card className="shadow-sm">
      <CardContent>
        <div className="flex flex-col items-center gap-4 py-4 text-center sm:flex-row sm:items-start sm:text-left">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-muted">
            <Smartphone className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <p className="text-sm font-semibold">WhatsApp Connection</p>
              {!isLoading && <StatusBadge status={status?.status ?? "DISCONNECTED"} />}
            </div>
            {status?.phoneNumber && (
              <p className="mt-1 text-sm text-muted-foreground">Connected as +{status.phoneNumber}</p>
            )}
            {status?.lastConnectedAt && (
              <p className="text-xs text-muted-foreground">
                Last connected {new Date(status.lastConnectedAt).toLocaleString("en-IN")}
              </p>
            )}
            <div className="mt-3 flex justify-center gap-2 sm:justify-start">
              {status?.isConnected ? (
                <Button variant="outline" onClick={() => logout.mutate()} disabled={logout.isPending}>
                  <Power className="h-4 w-4" /> Disconnect
                </Button>
              ) : (
                <Button onClick={() => initialize.mutate()} disabled={initialize.isPending}>
                  <PlugZap className="h-4 w-4" /> {status?.status === "QR_PENDING" ? "Refresh QR" : "Connect WhatsApp"}
                </Button>
              )}
            </div>
          </div>

          {status?.status === "QR_PENDING" && status.qrCode && (
            <div className="flex shrink-0 flex-col items-center gap-2 rounded-xl border p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={status.qrCode} alt="WhatsApp QR Code" className="h-40 w-40" />
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <QrCode className="h-3.5 w-3.5" /> Scan with WhatsApp
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
