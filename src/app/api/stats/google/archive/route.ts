import { NextResponse } from "next/server";
import { gate, JSON_HEADERS } from "@/lib/stats/server";
import { importGoogleYear } from "@/lib/stats/google-archive";
export const dynamic="force-dynamic";

/** Disabled by default; owner-controlled manual import only. No cron. */
export async function POST(request:Request){
  let input:{passphrase?:string;confirm?:boolean}={};
  try{input=await request.json();}catch{/* gate handles missing passphrase */}
  const denied=await gate(input.passphrase);
  if(denied)return denied;
  if(process.env.STATS_ARCHIVE_ENABLED!=="true")
    return NextResponse.json({error:"archive_disabled"}, {status:503,headers:JSON_HEADERS});
  if(input.confirm!==true)
    return NextResponse.json({error:"explicit_confirmation_required"}, {status:400,headers:JSON_HEADERS});
  try{
    const result=await importGoogleYear();
    return NextResponse.json(result,{headers:JSON_HEADERS,status:result.ok?200:424});
  }catch{
    return NextResponse.json({error:"archive_import_failed_check_server_logs"}, {status:502,headers:JSON_HEADERS});
  }
}
