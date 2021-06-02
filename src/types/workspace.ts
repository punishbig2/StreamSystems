import { Persistable } from "types/persistable";
import { WorkspaceType } from "types/workspaceType";

export interface Workspace extends Persistable<Workspace> {
  readonly id: string;
  readonly name: string;
  readonly modified: boolean;

  readonly type: WorkspaceType;

  setName(name: string): void;
  setModified(value: boolean): void;
}
