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
import { Textarea } from "@/components/ui/textarea";
import { useQuotationWorkflow } from "@/hooks/use-quotations";
import { useSendQuotationWhatsapp } from "@/hooks/use-whatsapp";
import type { Quotation } from "@/types/entities";
import { QuotationTemplateCode } from "@/types/enums";

export function RejectQuotationDialog({ quotation, trigger }: { quotation: Quotation; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const { reject } = useQuotationWorkflow(quotation.id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Quotation</DialogTitle>
          <DialogDescription>Provide a reason so the team knows why this was rejected.</DialogDescription>
        </DialogHeader>
        <Textarea
          rows={3}
          placeholder="e.g. Customer found the price too high"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={!reason.trim() || reject.isPending}
            onClick={() => reject.mutate(reason, { onSuccess: () => setOpen(false) })}
          >
            {reject.isPending ? "Rejecting..." : "Reject Quotation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ConvertToProjectDialog({ quotation, trigger }: { quotation: Quotation; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [expectedCompletionDate, setExpectedCompletionDate] = useState("");
  const [assignedTeam, setAssignedTeam] = useState("");
  const { convertToProject } = useQuotationWorkflow(quotation.id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convert to Project</DialogTitle>
          <DialogDescription>This creates a tracked project from this approved quotation.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Start Date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Expected Completion</Label>
            <Input type="date" value={expectedCompletionDate} onChange={(e) => setExpectedCompletionDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Finishes</Label>
            <Input placeholder="e.g. Team A - Ramesh, Suresh" value={assignedTeam} onChange={(e) => setAssignedTeam(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            disabled={convertToProject.isPending}
            onClick={() =>
              convertToProject.mutate(
                {
                  startDate: startDate || undefined,
                  expectedCompletionDate: expectedCompletionDate || undefined,
                  assignedTeam: assignedTeam || undefined,
                },
                { onSuccess: () => setOpen(false) },
              )
            }
          >
            {convertToProject.isPending ? "Converting..." : "Convert to Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SendQuotationWhatsAppDialog({ quotation, trigger }: { quotation: Quotation; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(quotation.customer?.whatsapp || quotation.customer?.phone || "");
  const template: string = quotation.template?.code ?? QuotationTemplateCode.TIME_FOR_TEXTURE;
  const sendQuotation = useSendQuotationWhatsapp();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Quotation via WhatsApp</DialogTitle>
          <DialogDescription>The PDF will be generated and queued for delivery.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>WhatsApp Number</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <p className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Sends the same PDF you see in Preview — <b className="text-foreground">{quotation.template?.name ?? "selected"}</b> template.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            disabled={!phone.trim() || sendQuotation.isPending}
            onClick={() =>
              sendQuotation.mutate(
                { quotationId: quotation.id, phone, template: template as never },
                { onSuccess: () => setOpen(false) },
              )
            }
          >
            {sendQuotation.isPending ? "Queuing..." : "Send via WhatsApp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
