import {usePrevious} from 'hooks/usePrevious';
import {useEffect} from 'react';

export const useValueComparator = (propsValue: number | null, stateValue: string, startFlashing: () => void) => {
  const oldValue: number | null | undefined = usePrevious<number | null>(propsValue);
  useEffect(() => {
    if (oldValue === null || oldValue === undefined)
      return;
    const numeric: number = Number(stateValue);
    if (propsValue === numeric)
      return;
    if (oldValue !== propsValue) {
      startFlashing();
    }
  }, [oldValue, propsValue, stateValue, startFlashing]);
};
