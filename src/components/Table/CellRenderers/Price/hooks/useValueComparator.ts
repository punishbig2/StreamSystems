import {usePrevious} from 'hooks/usePrevious';
import {useEffect} from 'react';

export const useValueComparator = (propsValue: number | null, stateValue: string, startFlashing: () => void) => {
  const oldValue: number | null | undefined = usePrevious<number | null>(propsValue);
  useEffect(() => {
    if (oldValue === null || oldValue === undefined)
      return;
    const numeric: number = Number(stateValue);
    if (propsValue === null)
      return;
    if (propsValue.toFixed(3) === numeric.toFixed(3))
      return;
    if (oldValue.toFixed(3) !== propsValue.toFixed(3)) {
      startFlashing();
    }
  }, [oldValue, propsValue, stateValue, startFlashing]);
};
