import { Action } from 'redux';

export enum ActionKind {
  Base = 'BASE',
}

interface __Action<T> extends Action<T> {
  kind: ActionKind,
  data: any;
}

export type FXOAction<T = string, E = any> = __Action<T> & E;

export const createAction = <T = any, A extends FXOAction = FXOAction<any>>(type: T, data?: any): A => (({
  kind: ActionKind.Base,
  type,
  data,
} as FXOAction) as A);

