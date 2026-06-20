import {
  EMPTY_FORM,
  type WorkspaceData,
} from "@/lib/types";

export const WORKSPACE_STORAGE_KEY = "nonstandard-opportunity-workspace-v3";
const LEGACY_WORKSPACE_STORAGE_KEY = "nonstandard-opportunity-workspace-v2";

export function createEmptyWorkspace(): WorkspaceData {
  return {
    version: 3,
    startedAt: new Date().toISOString(),
    form: structuredClone(EMPTY_FORM),
    assessment: null,
    assets: [],
    targets: [],
    actions: [],
    diagnoses: [],
    activeView: "input",
    updatedAt: new Date().toISOString(),
  };
}

export function loadWorkspace(): WorkspaceData {
  if (typeof window === "undefined") return createEmptyWorkspace();

  try {
    const raw =
      window.localStorage.getItem(WORKSPACE_STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_WORKSPACE_STORAGE_KEY);
    if (!raw) return createEmptyWorkspace();
    const parsed = JSON.parse(raw) as Partial<WorkspaceData>;
    if (parsed.version !== 3) {
      return {
        ...createEmptyWorkspace(),
        form: parsed.form ?? structuredClone(EMPTY_FORM),
        targets: parsed.targets ?? [],
        actions: parsed.actions ?? [],
        diagnoses: parsed.diagnoses ?? [],
      };
    }

    return {
      ...createEmptyWorkspace(),
      ...parsed,
      form: parsed.form ?? structuredClone(EMPTY_FORM),
      assets: parsed.assets ?? [],
      targets: parsed.targets ?? [],
      actions: parsed.actions ?? [],
      diagnoses: parsed.diagnoses ?? [],
    };
  } catch {
    return createEmptyWorkspace();
  }
}

export function saveWorkspace(workspace: WorkspaceData) {
  window.localStorage.setItem(
    WORKSPACE_STORAGE_KEY,
    JSON.stringify({ ...workspace, updatedAt: new Date().toISOString() }),
  );
}
