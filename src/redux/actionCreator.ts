import {Action} from 'redux/action';

export const createAction = <T>(type: T, data?: any): Action<T> => ({type, data});
