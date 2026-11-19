"use client";

import { FormEvent, useEffect, useState } from "react";

// Turn "owner mode" on or off for this browser. See public/footer.js for what it does.

const OWNER_RE = /^mw_owner_[0-9a-f]{16}$/;
const OTHER_DOMAINS = [
  { name: "Ballpark", host: "playballpark.app" },
  { name: "Venny", host: "playvenny.app" },
];

const C = { navy: "#0b1f44", blue: "#3d7be8", red: "#dc5b52", green: "#16a34a", mute: "#6b7a99", line: "#e6ebf3", bg: "#f3f6fb" };

function setLocal(id: string) {
  try { localStorage.setItem("mw:owner", id); } catch {}
  try {
    document.cookie = `mw_owner=${id}; domain=.minorworks.co; path=/; max-age=31536000; SameSite=Lax; Secure`;
  } catch {}
}
function clearLocal() {
  try { localStorage.removeItem("mw:owner"); localStorage.removeItem("mw:owner:hello"); } catch {}
  try { document.cookie = "mw_owner=; domain=.minorworks.co; path=/; max-age=0; SameSite=Lax; Secure"; } catch {}
}
function currentOwner(): string {
  try {
    const v = localStorage.getItem("mw:owner") || "";
    if (OWNER_RE.test(v)) return v;
    const m = document.cookie.match(/(?:^|; )mw_owner=([^;]+)/);
    return m && OWNER_RE.test(m[1]) ? m[1] : "";
  } catch { return ""; }
}

export default function OwnerPage() {
  const [pass, setPass] = useState("");
  const [on, setOn] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => { setOn(currentOwner()); }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!pass) return;
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/owner", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ passphrase: pass }) });
      if (r.status === 401) { setError("That passphrase did not work."); return; }
      if (!r.ok) { setError("Owner mode is not set up on the server yet."); return; }
      const j = (await r.json()) as { ownerId: string; token: string };
      if (!OWNER_RE.test(j.ownerId)) { setError("Unexpected answer from the server."); return; }
      setLocal(j.ownerId);
      setOn(j.ownerId);
      setToken(j.token);
    } catch { setError("Network trouble. Try again."); }
    finally { setBusy(false); }
  }

  function turnOff() {
    clearLocal(); setOn(""); setToken(""); setPass("");
  }

  async function copy(text: string, label: string) {
    try { await navigator.clipboard.writeText(text); setCopied(label); setTimeout(() => setCopied(""), 1800); } catch { window.prompt("Copy this link", text); }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10" style={{ background: C.navy }}>
      <div className="w-full max-w-md rounded-2xl bg-white p-7" style={{ boxShadow: "0 20px 50px rgba(0,0,0,.35)" }}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.mute }}>Minor Works</p>
        <h1 className="mt-1 text-3xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: C.navy, fontWeight: 700 }}>Owner mode</h1>
        <p className="mt-2 text-sm" style={{ color: C.mute }}>
          Marks this browser as you testing the sites, so your visits can be left out of the numbers. It is a flag in this browser only. It does not log you in anywhere.
        </p>

        <div className="mt-5 rounded-xl px-4 py-3 text-sm" style={{ background: on ? "#e8f7ee" : C.bg, color: on ? "#14532d" : C.navy }} role="status">
          {on ? <>Owner mode is <b>on</b> in this browser for all minorworks.co sites.</> : <>Owner mode is <b>off</b> in this browser.</>}
        </div>

        {!on && (
          <form onSubmit={submit} className="mt-5">
            <label htmlFor="pp" className="block text-sm font-medium" style={{ color: C.navy }}>Passphrase</label>
            <input id="pp" type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)}
              className="mt-1.5 w-full rounded-lg px-3 py-2.5 text-base outline-none" style={{ border: `1px solid ${C.line}` }} />
            {error && <p role="alert" className="mt-3 text-sm" style={{ color: C.red }}>{error}</p>}
            <button type="submit" disabled={busy || !pass} className="mt-4 w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-60" style={{ background: C.blue }}>
              {busy ? "Checking…" : "Turn on owner mode"}
            </button>
          </form>
        )}

        {on && token && (
          <section className="mt-5">
            <h2 className="text-sm font-semibold" style={{ color: C.navy }}>Other domains</h2>
            <p className="mt-1 text-sm" style={{ color: C.mute }}>
              These sites live outside minorworks.co, so each needs its own switch-on. Open each link once in this browser. They work for 10 minutes.
            </p>
            <ul className="mt-3 space-y-2">
              {OTHER_DOMAINS.map((d) => {
                const url = `https://${d.host}/?mwowner=${token}`;
                return (
                  <li key={d.host} className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm" style={{ border: `1px solid ${C.line}` }}>
                    <a href={url} className="font-medium underline" style={{ color: C.blue }}>{d.name}</a>
                    <button type="button" onClick={() => copy(url, d.host)} className="rounded-md px-2 py-1 text-xs font-medium" style={{ background: C.bg, color: C.navy }}>
                      {copied === d.host ? "Copied" : "Copy link"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {on && (
          <section className="mt-5 border-t pt-4" style={{ borderColor: C.line }}>
            <button type="button" onClick={turnOff} className="text-sm font-medium underline" style={{ color: C.red }}>Turn off owner mode in this browser</button>
            <p className="mt-2 text-xs" style={{ color: C.mute }}>
              On playballpark.app or playvenny.app you can also add <code>?mwowner=off</code> to the address.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
