import { NextResponse } from "next/server";
import { gate, JSON_HEADERS } from "@/lib/stats/server";
import { googleReports } from "@/lib/stats/google";
export const dynamic="force-dynamic";

/** Separate protected read-only integration; never exposes service-account credentials. */
export async function POST(req: Request) {
  let body: {passphrase?:string;days?:number}={};
  try { body=await req.json(); } catch { /* require gate even on invalid JSON */ }
  const denied=await gate(body.passphrase);
  if(denied) return denied;
  const days=[7,30,90,365].includes(Number(body.days))?Number(body.days):30;
  try {
    return NextResponse.json(await googleReports(days),{headers:JSON_HEADERS});
  } catch(e) {
    // Fail closed and never return raw Google API errors or credentials.
    const message=e instanceof Error?e.message:"Unknown Google connection error";
    const safe=/^Invalid GA4_PROPERTIES|^Invalid GSC_SITES|^Google OAuth HTTP \d+$|^Google OAuth returned no access token|^Invalid GOOGLE_SERVICE_ACCOUNT_JSON|^Google credential is incomplete/.test(message)?message:"Google reports unavailable";
    return NextResponse.json({error:"google_reporting_unavailable",message:safe},{status:502,headers:JSON_HEADERS});
  }
}
