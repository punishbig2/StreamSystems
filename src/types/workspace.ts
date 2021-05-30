export interface Workspace {
  readonly id: string;
  readonly name: string;
  readonly modified: boolean;

  setName(name: string): void;

  setModified(value: boolean): void;
}
