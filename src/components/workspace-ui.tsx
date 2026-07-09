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
      className="btn btn-ghost"
      style={{ fontSize: 12, padding: "4px 10px" }}
    >
      {copied ? <Check size={13} /> : <Clipboard size={13} />}
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
      className="btn btn-primary"
      style={{ padding: "10px 20px" }}
    >
      {loading && <LoaderCircle size={15} className="animate-spin" />}
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
    <div className="empty-state">
      <div className="empty-state-icon">◇</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

export function ErrorNotice({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      style={{
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--danger-light)",
        background: "var(--danger-light)",
        padding: "10px 14px",
        fontSize: 12,
        lineHeight: 1.5,
        color: "var(--danger)",
      }}
    >
      {message}
    </div>
  );
}
