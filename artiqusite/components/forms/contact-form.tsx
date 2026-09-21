"use client";

import { useState, type FormEvent } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

type Status = "idle" | "submitting" | "success" | "error";

/**
 * Fields mirror PublicContactDto on the backend exactly (customerName,
 * phone, email, city, requirement, referredBy) — submits to
 * POST /public/contact, which creates a lead and queues a WhatsApp
 * acknowledgement through whichever number is connected in the admin
 * panel (Settings → WhatsApp, paired by QR code).
 */
export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      customerName: String(form.get("customerName") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
      email: String(form.get("email") || "").trim() || undefined,
      city: String(form.get("city") || "").trim() || undefined,
      requirement: String(form.get("requirement") || "").trim() || undefined,
    };

    try {
      const res = await fetch(`${API_URL}/public/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
      event.currentTarget.reset();
    } catch {
      setStatus("error");
      setError("Something went wrong — please call us instead.");
    }
  }

  if (status === "success") {
    return (
      <div className="w-full max-w-[424px] rounded-[2px] border border-ink/15 bg-paper/90 p-6">
        <p className="text-head-5 text-ink">Thanks — we&apos;ll be in touch.</p>
        <p className="text-small mt-2 text-ink-soft/80">
          A confirmation is on its way to your WhatsApp, and our team will follow up shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-[424px] shrink-0 space-y-3">
      <input
        name="customerName"
        type="text"
        required
        placeholder="Your name"
        className="text-small h-[52px] w-full rounded-[2px] border border-ink/15 bg-paper/90 px-5 text-ink placeholder:text-ink/45 focus:border-indigo focus:outline-none"
      />
      <input
        name="phone"
        type="tel"
        required
        placeholder="WhatsApp number"
        className="text-small h-[52px] w-full rounded-[2px] border border-ink/15 bg-paper/90 px-5 text-ink placeholder:text-ink/45 focus:border-indigo focus:outline-none"
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          name="email"
          type="email"
          placeholder="Email (optional)"
          className="text-small h-[52px] w-full rounded-[2px] border border-ink/15 bg-paper/90 px-5 text-ink placeholder:text-ink/45 focus:border-indigo focus:outline-none"
        />
        <input
          name="city"
          type="text"
          placeholder="City (optional)"
          className="text-small h-[52px] w-full rounded-[2px] border border-ink/15 bg-paper/90 px-5 text-ink placeholder:text-ink/45 focus:border-indigo focus:outline-none"
        />
      </div>
      <textarea
        name="requirement"
        rows={2}
        placeholder="What are you looking to resurface? (optional)"
        className="text-small w-full resize-none rounded-[2px] border border-ink/15 bg-paper/90 px-5 py-3 text-ink placeholder:text-ink/45 focus:border-indigo focus:outline-none"
      />

      <div className="flex flex-wrap items-center gap-6 pt-1">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="relative flex h-[52px] items-center overflow-hidden rounded-[2px] bg-indigo pl-8 pr-[38px] text-[15px] font-semibold text-paper disabled:opacity-60"
        >
          {status === "submitting" ? "Sending…" : "Book a sample visit"}
          <span className="absolute right-0 top-0 h-full w-[8px] bg-brass" />
        </button>
        <a href="tel:+914274000000" className="text-small text-ink-soft/85">
          Or call &nbsp;+91 427 400 0000
        </a>
      </div>
      {error && <p className="text-small text-red-700">{error}</p>}
    </form>
  );
}
