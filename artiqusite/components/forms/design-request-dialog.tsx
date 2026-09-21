"use client";

import { useState, type FormEvent } from "react";
import { Portal } from "@/components/portal";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

type Status = "idle" | "submitting" | "success" | "error";

/**
 * Standalone request-form popup — deliberately separate from
 * DesignViewDialog rather than one combined dialog. Opened directly (from
 * the card's hover button) or from inside the view popup's "Request this"
 * button.
 */
export function DesignRequestDialog({
  designId,
  title,
  open,
  onClose,
}: {
  designId: string;
  title: string;
  open: boolean;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<Status>("idle");

  function close() {
    onClose();
    setStatus("idle");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");

    const form = new FormData(event.currentTarget);
    const payload = {
      customerName: String(form.get("customerName") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
      email: String(form.get("email") || "").trim() || undefined,
      message: String(form.get("message") || "").trim() || undefined,
    };

    try {
      const res = await fetch(`${API_URL}/public/gallery/${designId}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (!open) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button type="button" aria-label="Close" onClick={close} className="fixed inset-0 bg-ink/60" />
      <div className="relative w-full max-w-[420px] rounded-[3px] bg-paper p-8 shadow-[0px_30px_60px_0px_rgba(27,36,54,0.35)]">
        {status === "success" ? (
          <>
            <p className="text-head-5 text-ink">Sent.</p>
            <p className="text-small mt-2 text-ink-soft/80">
              We&apos;ve messaged you on WhatsApp with a photo of &ldquo;{title}&rdquo; — our team will follow up
              shortly.
            </p>
            <button type="button" onClick={close} className="text-small mt-6 font-semibold text-ink underline underline-offset-4">
              Close
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-head-5 text-ink">Ask about &ldquo;{title}&rdquo;</p>
            <p className="text-small text-ink-soft/70">We&apos;ll send you a WhatsApp message with the photo to confirm.</p>
            <input
              name="customerName"
              type="text"
              required
              placeholder="Your name"
              className="text-small mt-2 h-[48px] w-full rounded-[2px] border border-ink/15 bg-chalk px-4 text-ink placeholder:text-ink/45 focus:border-indigo focus:outline-none"
            />
            <input
              name="phone"
              type="tel"
              required
              placeholder="WhatsApp number"
              className="text-small h-[48px] w-full rounded-[2px] border border-ink/15 bg-chalk px-4 text-ink placeholder:text-ink/45 focus:border-indigo focus:outline-none"
            />
            <input
              name="email"
              type="email"
              placeholder="Email (optional)"
              className="text-small h-[48px] w-full rounded-[2px] border border-ink/15 bg-chalk px-4 text-ink placeholder:text-ink/45 focus:border-indigo focus:outline-none"
            />
            <textarea
              name="message"
              rows={2}
              placeholder="Anything specific? (optional)"
              className="text-small w-full resize-none rounded-[2px] border border-ink/15 bg-chalk px-4 py-3 text-ink placeholder:text-ink/45 focus:border-indigo focus:outline-none"
            />
            {status === "error" && <p className="text-small text-red-700">Something went wrong — please try again.</p>}
            <div className="flex items-center gap-5 pt-1">
              <button
                type="submit"
                disabled={status === "submitting"}
                className="relative flex h-[48px] items-center overflow-hidden rounded-[2px] bg-indigo pl-6 pr-8 text-[14px] font-semibold text-paper disabled:opacity-60"
              >
                {status === "submitting" ? "Sending…" : "Send request"}
                <span className="absolute right-0 top-0 h-full w-[6px] bg-brass" />
              </button>
              <button type="button" onClick={close} className="text-small text-ink-soft/70">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
    </Portal>
  );
}
