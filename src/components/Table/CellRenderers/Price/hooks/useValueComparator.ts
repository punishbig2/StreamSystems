import { usePrevious } from "hooks/usePrevious";
import { useEffect } from "react";
import { OrderStatus } from "interfaces/order";

export const useValueComparator = (
  propsValue: number | null,
  startFlashing: () => void,
  status: OrderStatus
) => {
  const oldValue: number | null | undefined = usePrevious<number | null>(
    propsValue
  );
  useEffect(() => {
    if (oldValue === null || oldValue === undefined || propsValue === null)
      return;
    if ((status & OrderStatus.Owned) !== 0) return;
    if (propsValue.toFixed(3) !== oldValue.toFixed(3)) startFlashing();
  }, [oldValue, propsValue, startFlashing, status]);
};
