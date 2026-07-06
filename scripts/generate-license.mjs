#!/usr/bin/env node
// 手工发放 Pro 解锁码：付款确认后运行本脚本，把生成的解锁码发给用户。
// 用法：LICENSE_SECRET=xxx node scripts/generate-license.mjs "用户标识（邮箱或昵称）"

import { createHmac } from "node:crypto";

const secret = process.env.LICENSE_SECRET;
if (!secret) {
  console.error("缺少 LICENSE_SECRET 环境变量。");
  process.exit(1);
}

const issuedTo = process.argv[2] ?? "";
const payload = {
  plan: "pro",
  issuedTo,
  issuedAt: new Date().toISOString(),
};

const prefix = "CLD1";
const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
  "base64url",
);
const signature = createHmac("sha256", secret)
  .update(`${prefix}.${encodedPayload}`)
  .digest("base64url");

console.log(`${prefix}.${encodedPayload}.${signature}`);
