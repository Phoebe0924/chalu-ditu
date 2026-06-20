import { NextResponse } from "next/server";
import { REGRESSION_SAMPLES } from "@/lib/regression-samples";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json({ samples: REGRESSION_SAMPLES });
}
