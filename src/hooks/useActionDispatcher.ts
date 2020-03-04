import {Dispatch} from 'react';

export const useActionDispatcher = <T>(actions: (T | null)[], dispatch: Dispatch<T>) => {
  actions.forEach((action: T | null) => {
    if (action === null)
      return;
    dispatch(action);
  });
};
