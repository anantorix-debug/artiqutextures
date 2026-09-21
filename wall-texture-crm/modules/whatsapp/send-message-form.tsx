"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CustomerPicker } from "@/modules/quotations/customer-picker";
import { useSendText } from "@/hooks/use-whatsapp";
import type { Customer } from "@/types/entities";

export function SendMessageForm() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [phone, setPhone] = useState("");
  const [content, setContent] = useState("");
  const sendText = useSendText();

  const canSend = (customer || phone.trim()) && content.trim();

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Send Text Message</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label>Customer (optional)</Label>
          <CustomerPicker value={customer} onSelect={setCustomer} />
        </div>
        <div className="space-y-1.5">
          <Label>Or enter a phone number directly</Label>
          <Input
            placeholder="9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={!!customer}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Message</Label>
          <Textarea rows={3} value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
        <Button
          disabled={!canSend || sendText.isPending}
          onClick={() =>
            sendText.mutate(
              { customerId: customer?.id, phone: customer ? undefined : phone, content },
              { onSuccess: () => setContent("") },
            )
          }
        >
          <Send className="h-4 w-4" /> {sendText.isPending ? "Queuing..." : "Send Message"}
        </Button>
      </CardContent>
    </Card>
  );
}
