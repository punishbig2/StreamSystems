import {usePrevious} from 'hooks/usePrevious';
import {useEffect} from 'react';
import {OrderStatus} from 'interfaces/order';

export const useValueComparator = (propsValue: number | null, stateValue: string, startFlashing: () => void, propsStatus: OrderStatus, stateStatus: OrderStatus) => {
  const oldValue: number | null | undefined = usePrevious<number | null>(
    propsValue,
  );
  useEffect(() => {
    if (
      oldValue === null
      || oldValue === undefined
      || (stateStatus & OrderStatus.Cancelled) !== 0
      || (stateStatus & OrderStatus.Owned) !== 0
      || (propsStatus & OrderStatus.Cancelled) !== 0
    )
      return;
    const numeric: number = Number(stateValue);
    if (propsValue === null) {
      return;
    }
    if (propsValue.toFixed(3) === numeric.toFixed(3)) {
      return;
    }
    if (oldValue.toFixed(3) !== propsValue.toFixed(3)) {
      startFlashing();
    }
  }, [oldValue, propsValue, stateValue, startFlashing, stateStatus]);
};
