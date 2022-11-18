import { OrderStatus } from 'types/order';

export const activateOrderIfPossible = (status: OrderStatus): OrderStatus => {
  if ((status & OrderStatus.Cancelled) === 0) return status;
  const edited: OrderStatus = OrderStatus.PriceEdited | OrderStatus.SizeEdited;
  return (status | edited) & ~OrderStatus.Cancelled;
};
