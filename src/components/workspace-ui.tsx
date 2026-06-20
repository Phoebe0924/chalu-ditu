"use client";

import { Check, Clipboard, LoaderCircle } from "lucide-react";
import { useState, type ReactNode } from "react";

export function CopyButton({
  text,
  label = "复制",
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#d9d3c8] bg-[#fffdf8] px-3 py-2 text-xs font-medium text-[#55584f] transition hover:border-[#b8aea0] hover:text-[#252822]"
    >
      {copied ? <Check size={14} /> : <Clipboard size={14} />}
      {copied ? "已复制" : label}
    </button>
  );
}

export function PrimaryButton({
  children,
  disabled,
  loading,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#252822] px-4 py-3 text-sm font-semibold text-[#fffdf8] transition hover:bg-[#373a33] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {loading && <LoaderCircle size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

export function EmptyPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-[420px] items-center justify-center p-8 text-center">
      <div className="max-w-md">
        <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#252822]">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-7 text-[#6e7168]">{description}</p>
        {children && <div className="mt-5">{children}</div>}
      </div>
    </div>
  );
}

export function ErrorNotice({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="rounded-xl border border-[#e6c1b8] bg-[#f9e8e4] px-4 py-3 text-xs leading-5 text-[#8f392d]"
    >
      {message}
    </div>
  );
}
