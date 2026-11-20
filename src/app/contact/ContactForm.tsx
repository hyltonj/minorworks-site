"use client";

import { useEffect, useState, type FormEvent } from "react";

// Posts to Netlify Forms. Netlify learns the form from public/__forms.html at deploy time,
// so the field names here must match that file. Nothing typed into the form goes to analytics.

const FALLBACK_EMAIL = "hello@minorworks.co";
const FORM_NAME = "minorworks-contact";

type Status = "idle" | "sending" | "success" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [site, setSite] = useState("");

  useEffect(() => {
    try {
      // Which project sent the visitor here, from the footer link. Letters, numbers and dashes only.
      const s = new URLSearchParams(window.location.search).get("site") || "";
      setSite(/^[a-z0-9-]{1,40}$/i.test(s) ? s.toLowerCase() : "");
    } catch {
      /* no site */
    }
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    const form = e.currentTarget;
    const data = new FormData(form);
    const body = new URLSearchParams();
    body.set("form-name", FORM_NAME);
    for (const k of ["bot-field", "name", "email", "message"]) body.set(k, String(data.get(k) || ""));
    body.set("site", site);
    try {
      const res = await fetch("/__forms.html", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      if (!res.ok) throw new Error("bad status");
      setStatus("success");
      form.reset();
      // Counts the submission for the studio's analytics. Only the project name travels, never what was typed.
      try {
        window.dispatchEvent(
          new CustomEvent("mwfooter:send", { detail: { name: "contact_submit", props: { from_site: site || "direct" } } })
        );
      } catch {
        /* analytics is optional */
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div role="status" className="rounded-mw border border-mw-border bg-white p-8 text-center shadow-mw">
        <p className="mb-1 text-base font-bold text-mw-text-dark">Message sent</p>
        <p className="text-sm text-mw-text-muted">Thanks for writing. We will get back to you soon.</p>
      </div>
    );
  }

  const field =
    "mw-focus-ring rounded-mw-sm border border-mw-border bg-white px-3 py-2 text-sm text-mw-text-dark";

  return (
    <div className="rounded-mw border border-mw-border bg-white p-6 shadow-mw sm:p-8">
      <form name={FORM_NAME} method="POST" onSubmit={onSubmit} className="flex flex-col gap-4">
        {/* Spam trap: hidden from people, filled in by bots. Netlify drops any message that has it. */}
        <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
          <label>
            Leave this empty
            <input type="text" name="bot-field" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-left text-sm">
          <span className="font-semibold text-mw-text-dark">
            Name <span className="font-normal text-mw-text-light">(optional)</span>
          </span>
          <input type="text" name="name" autoComplete="name" className={field} />
        </label>

        <label className="flex flex-col gap-1 text-left text-sm">
          <span className="font-semibold text-mw-text-dark">Email</span>
          <input type="email" name="email" required autoComplete="email" className={field} />
        </label>

        <label className="flex flex-col gap-1 text-left text-sm">
          <span className="font-semibold text-mw-text-dark">Message</span>
          <textarea name="message" required rows={6} className={`${field} resize-y`} />
        </label>

        {status === "error" && (
          <p role="alert" className="text-sm text-mw-error">
            That did not go through. Please try again, or write to us directly at{" "}
            <a className="underline underline-offset-4" href={`mailto:${FALLBACK_EMAIL}`}>
              {FALLBACK_EMAIL}
            </a>
            .
          </p>
        )}

        <button
          type="submit"
          disabled={status === "sending"}
          className="mw-focus-ring mt-2 inline-flex items-center justify-center rounded-mw-sm bg-mw-primary px-6 py-3 text-sm font-bold tracking-wide text-white transition-colors hover:bg-mw-primary/90 disabled:opacity-60"
        >
          {status === "sending" ? "Sending…" : "Send message"}
        </button>
      </form>

      <p className="mt-6 border-t border-mw-border pt-4 text-center text-sm text-mw-text-muted">
        Prefer email?{" "}
        <a className="underline underline-offset-4" href={`mailto:${FALLBACK_EMAIL}`}>
          {FALLBACK_EMAIL}
        </a>
      </p>
    </div>
  );
}
