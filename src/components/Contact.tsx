"use client";

import { useEffect, useState, type FormEvent } from "react";

// Sends via Web3Forms (https://web3forms.com) — no backend of our own
// needed, and hyltonj@gmail.com never appears in the page source. The
// access key below is safe to be public: Web3Forms treats it as an alias
// for the destination inbox, not a secret.
//
// TODO: replace with the real key from https://web3forms.com once
// generated (enter hyltonj@gmail.com there to get one emailed).
const WEB3FORMS_ACCESS_KEY = "YOUR_ACCESS_KEY_HERE";

type Status = "idle" | "submitting" | "success" | "error";

export default function Contact() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function openModal() {
    setStatus("idle");
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    window.setTimeout(() => setStatus("idle"), 200);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });
      const result = await res.json();
      if (result.success) {
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="px-6 max-w-xl mx-auto pb-20 md:pb-28">
      <div className="rounded-mw border border-mw-border bg-white p-8 text-center shadow-mw sm:p-10">
        <h2 className="mb-2 text-lg font-semibold text-mw-text-dark">
          Say hello
        </h2>
        <p className="mb-6 text-sm text-mw-text-muted">
          Questions, feedback, or just want to say the estimation game
          ruined your afternoon?
        </p>
        <button
          type="button"
          onClick={openModal}
          className="mw-focus-ring inline-flex rounded-mw-sm bg-mw-primary px-6 py-3 text-sm font-bold tracking-wide text-white transition-colors hover:bg-mw-primary/90"
        >
          Get in touch
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-md rounded-mw bg-white p-6 shadow-mw-lift sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close"
              className="mw-focus-ring absolute right-5 top-5 text-lg text-mw-text-light transition-colors hover:text-mw-text-dark"
            >
              ×
            </button>

            {status === "success" ? (
              <div className="py-6 text-center">
                <p className="mb-1 text-base font-bold text-mw-text-dark">
                  Message sent
                </p>
                <p className="text-sm text-mw-text-muted">
                  Thanks for reaching out — we&apos;ll get back to you soon.
                </p>
                <button
                  type="button"
                  onClick={closeModal}
                  className="mw-focus-ring mt-6 inline-flex rounded-mw-sm bg-mw-primary px-6 py-2.5 text-sm font-bold tracking-wide text-white transition-colors hover:bg-mw-primary/90"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <h3 className="text-base font-bold text-mw-text-dark">
                  Say hello
                </h3>

                <input
                  type="hidden"
                  name="access_key"
                  value={WEB3FORMS_ACCESS_KEY}
                />
                <input
                  type="hidden"
                  name="subject"
                  value="Minor Works Submission"
                />
                <input
                  type="checkbox"
                  name="botcheck"
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  style={{ display: "none" }}
                />

                <label className="flex flex-col gap-1 text-left text-sm">
                  <span className="font-semibold text-mw-text-dark">
                    Name
                  </span>
                  <input
                    type="text"
                    name="name"
                    required
                    className="mw-focus-ring rounded-mw-sm border border-mw-border px-3 py-2 text-sm text-mw-text-dark"
                  />
                </label>

                <label className="flex flex-col gap-1 text-left text-sm">
                  <span className="font-semibold text-mw-text-dark">
                    Email
                  </span>
                  <input
                    type="email"
                    name="email"
                    required
                    className="mw-focus-ring rounded-mw-sm border border-mw-border px-3 py-2 text-sm text-mw-text-dark"
                  />
                </label>

                <label className="flex flex-col gap-1 text-left text-sm">
                  <span className="font-semibold text-mw-text-dark">
                    Message
                  </span>
                  <textarea
                    name="message"
                    required
                    rows={4}
                    className="mw-focus-ring resize-none rounded-mw-sm border border-mw-border px-3 py-2 text-sm text-mw-text-dark"
                  />
                </label>

                {status === "error" && (
                  <p className="text-sm text-mw-error">
                    Something went wrong — try again, or email
                    hyltonj@gmail.com directly.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="mw-focus-ring mt-2 inline-flex items-center justify-center rounded-mw-sm bg-mw-primary px-6 py-3 text-sm font-bold tracking-wide text-white transition-colors hover:bg-mw-primary/90 disabled:opacity-60"
                >
                  {status === "submitting" ? "Sending…" : "Send message"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
