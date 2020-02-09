import {Action} from 'redux';

interface __Action<T> extends Action<T> {
  data: any;
}

export type FXOAction<T = string, E = any> = __Action<T> & E;
