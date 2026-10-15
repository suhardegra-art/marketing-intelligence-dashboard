import { NextRequest } from "next/server";
import { readMetaDashboard } from "@/lib/meta-read";
export const runtime="nodejs";
export const dynamic="force-dynamic";
// DB-ONLY: clients do not call Meta Graph API.
export async function GET(request:NextRequest){return readMetaDashboard(request,"instagram");}
