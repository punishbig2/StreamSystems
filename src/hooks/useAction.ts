import {useState} from 'react';

export const useAction = <T>() => {
  const [action, dispatch] = useState<T | null>(null);
  if (action !== null)
    dispatch(null);
  return [action, dispatch];
};
