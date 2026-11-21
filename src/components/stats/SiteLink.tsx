"use client";

import Link from "next/link";
import { isSiteId, siteName } from "@/lib/stats/model";
import { C } from "./ui";

/** Site name that links to its workspace page when the id is in the registry. */
export function SiteLink({ id }: { id: string }) {
  return isSiteId(id)
    ? <Link href={`/stats/sites/${id}`} className="font-medium underline-offset-2 hover:underline" style={{ color: C.navy2 }}>{siteName(id)}</Link>
    : <span className="font-medium">{id}</span>;
}
