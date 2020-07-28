import { OrderStatus } from "types/order";

export const getFinalSize = (
  status: OrderStatus,
  submittedSize: number | null,
  orderSize: number | null,
  minimumSize: number,
  defaultSize?: number
): number => {
  if ((status & OrderStatus.Owned) === 0)
    return defaultSize !== undefined ? defaultSize : minimumSize;
  // If a size was submitted use it
  if (submittedSize !== null) return submittedSize;
  // Otherwise use current order's size
  if (orderSize !== null) return orderSize;
  // Finally use the default size
  if (defaultSize === undefined)
    throw new Error("impossible to determine order creation size");
  return defaultSize;
};
