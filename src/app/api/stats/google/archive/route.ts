import { NextResponse } from "next/server";
import { gate, JSON_HEADERS } from "@/lib/stats/server";
import { archiveStatus, importGoogleYear } from "@/lib/stats/google-archive";
export const dynamic="force-dynamic";

/**
 * Owner-only private archive maintenance; no credentials, query strings or
 * visitor IDs are returned. Read-only status works before import is enabled.
 */
export async function POST(request:Request){
  let input:{passphrase?:string;confirm?:boolean;action?:"status"|"import"}={};
  try { input=await request.json(); } catch { /* gate handles missing password */ }
  const denied=await gate(input.passphrase);
  if (denied) return denied;
  if (input.action==="status") {
    try {
      return NextResponse.json(await archiveStatus(),{headers:JSON_HEADERS});
    } catch {
      return NextResponse.json({error:"archive_connection_unavailable"},{status:503,headers:JSON_HEADERS});
    }
  }
  if (input.action!=="import")
    return NextResponse.json({error:"invalid_action"},{status:400,headers:JSON_HEADERS});
  if (process.env.STATS_ARCHIVE_ENABLED!=="true")
    return NextResponse.json({error:"archive_disabled"},{status:503,headers:JSON_HEADERS});
  if (input.confirm!==true)
    return NextResponse.json({error:"explicit_confirmation_required"},{status:400,headers:JSON_HEADERS});
  try {
    const result=await importGoogleYear();
    return NextResponse.json(result,{headers:JSON_HEADERS,status:result.ok?200:424});
  } catch {
    return NextResponse.json({error:"archive_import_failed"},{status:502,headers:JSON_HEADERS});
  }
}
