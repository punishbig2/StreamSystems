import { OrderStatus } from "interfaces/order";
import { useEffect } from "react";
import { priceFormatter } from "utils/priceFormatter";

export const useValueListener = (
  value: number | null,
  timestamp: string | undefined,
  setValue: (value: string, status: OrderStatus) => void
) => {
  useEffect(() => {
    setValue(
      priceFormatter(value),
      OrderStatus.None & ~OrderStatus.PriceEdited
    );
  }, [value, timestamp, setValue]);
};
