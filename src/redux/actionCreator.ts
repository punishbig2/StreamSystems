import {Action, AnyAction} from 'redux';

export const createAction = <T = any, A extends Action = AnyAction>(type: T, data?: any): A => ({type, data}) as AnyAction as A;
