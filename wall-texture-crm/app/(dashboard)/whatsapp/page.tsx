"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ConnectionPanel } from "@/modules/whatsapp/connection-panel";
import { SendMessageForm } from "@/modules/whatsapp/send-message-form";
import { MessageLog } from "@/modules/whatsapp/message-log";

export default function WhatsappPage() {
  return (
    <div>
      <PageHeader title="WhatsApp" description="Connect your WhatsApp account and manage outgoing messages" />

      <div className="space-y-4">
        <ConnectionPanel />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <SendMessageForm />
          </div>
          <div className="lg:col-span-2">
            <MessageLog />
          </div>
        </div>
      </div>
    </div>
  );
}
