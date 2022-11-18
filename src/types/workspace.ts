import { Persistable } from 'types/persistable';
import { WorkspaceType } from 'types/workspaceType';

export interface Workspace extends Persistable<Workspace> {
  readonly name: string;
  readonly type: WorkspaceType;

  readonly modified: boolean;

  setName(name: string): void;
  setModified(value: boolean): void;
}
