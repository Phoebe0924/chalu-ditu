export const ENTITLEMENT_STORAGE_KEY = "chalu-ditu-entitlement-v1";

export const FREE_QUOTA = {
  assess: 2,
  actionPackage: 2,
  calibrate: 4,
} as const;

export type UsageKind = keyof typeof FREE_QUOTA;

export type Entitlement = {
  version: 1;
  plan: "free" | "pro";
  licenseKey: string;
  unlockedAt: string;
  usage: Record<UsageKind, number>;
};

export function createFreeEntitlement(): Entitlement {
  return {
    version: 1,
    plan: "free",
    licenseKey: "",
    unlockedAt: "",
    usage: { assess: 0, actionPackage: 0, calibrate: 0 },
  };
}

export function loadEntitlement(): Entitlement {
  if (typeof window === "undefined") return createFreeEntitlement();
  try {
    const raw = window.localStorage.getItem(ENTITLEMENT_STORAGE_KEY);
    if (!raw) return createFreeEntitlement();
    const parsed = JSON.parse(raw) as Partial<Entitlement>;
    if (parsed.version !== 1) return createFreeEntitlement();
    return {
      ...createFreeEntitlement(),
      ...parsed,
      usage: { ...createFreeEntitlement().usage, ...(parsed.usage ?? {}) },
    };
  } catch {
    return createFreeEntitlement();
  }
}

export function saveEntitlement(entitlement: Entitlement) {
  window.localStorage.setItem(
    ENTITLEMENT_STORAGE_KEY,
    JSON.stringify(entitlement),
  );
}

export function remainingQuota(
  entitlement: Entitlement,
  kind: UsageKind,
): number | null {
  if (entitlement.plan === "pro") return null;
  return Math.max(0, FREE_QUOTA[kind] - entitlement.usage[kind]);
}

export function canUse(entitlement: Entitlement, kind: UsageKind): boolean {
  const remaining = remainingQuota(entitlement, kind);
  return remaining === null || remaining > 0;
}

export function recordUsage(
  entitlement: Entitlement,
  kind: UsageKind,
): Entitlement {
  return {
    ...entitlement,
    usage: { ...entitlement.usage, [kind]: entitlement.usage[kind] + 1 },
  };
}

export const USAGE_LABELS: Record<UsageKind, string> = {
  assess: "路径评估",
  actionPackage: "行动包生成",
  calibrate: "反馈校准",
};
