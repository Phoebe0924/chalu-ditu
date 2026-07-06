import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY_PREFIX = "CLD1";

type LicensePayload = {
  plan: "pro";
  issuedTo: string;
  issuedAt: string;
};

function decodePayload(encoded: string): LicensePayload | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as Partial<LicensePayload>;
    if (parsed.plan !== "pro" || !parsed.issuedAt) return null;
    return {
      plan: "pro",
      issuedTo: parsed.issuedTo ?? "",
      issuedAt: parsed.issuedAt,
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const secret = process.env.LICENSE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "解锁服务尚未配置。请联系产品作者获取帮助。" },
      { status: 503 },
    );
  }

  let key = "";
  try {
    const body = (await request.json()) as { key?: string };
    key = (body.key ?? "").trim();
  } catch {
    // fall through to the empty-key check
  }

  const parts = key.split(".");
  if (parts.length !== 3 || parts[0] !== KEY_PREFIX) {
    return NextResponse.json(
      { error: "解锁码格式不正确。" },
      { status: 400 },
    );
  }

  const [, encodedPayload, signature] = parts;
  const expected = createHmac("sha256", secret)
    .update(`${KEY_PREFIX}.${encodedPayload}`)
    .digest("base64url");
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  const valid =
    expectedBuffer.length === signatureBuffer.length &&
    timingSafeEqual(expectedBuffer, signatureBuffer);
  if (!valid) {
    return NextResponse.json(
      { error: "解锁码无效。请核对后重试。" },
      { status: 400 },
    );
  }

  const payload = decodePayload(encodedPayload);
  if (!payload) {
    return NextResponse.json(
      { error: "解锁码内容无法解析。" },
      { status: 400 },
    );
  }

  return NextResponse.json({ plan: payload.plan, issuedAt: payload.issuedAt });
}
