"use client";

import { useState } from "react";
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
import { useSendGalleryImageWhatsapp } from "@/hooks/use-whatsapp";

export function SendGalleryWhatsAppDialog({ galleryId, trigger }: { galleryId: string; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const sendImage = useSendGalleryImageWhatsapp();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share via WhatsApp</DialogTitle>
          <DialogDescription>Send this gallery image to a customer's WhatsApp number.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>WhatsApp Number</Label>
          <Input placeholder="9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            disabled={!phone.trim() || sendImage.isPending}
            onClick={() => sendImage.mutate({ galleryId, phone }, { onSuccess: () => setOpen(false) })}
          >
            {sendImage.isPending ? "Sending..." : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
