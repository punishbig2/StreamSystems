import {Action} from 'redux';

export enum ActionKind {
  Base = 'BASE',
  Workspace = 'WORKSPACE',
  Window = 'WINDOW',
}

interface __Action<T> extends Action<T> {
  kind: ActionKind,
  data: any;
}

export type FXOAction<T = string, E = any> = __Action<T> & E;
