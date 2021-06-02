import { WorkspaceType } from "types/workspaceType";

export interface Workspace {
  readonly id: string;
  readonly name: string;
  readonly modified: boolean;

  readonly type: WorkspaceType;

  setName(name: string): void;

  setModified(value: boolean): void;
}
