import { useEffect } from 'react';
import { OrderStatus } from 'types/order';

export const useStatusUpdater = (status: OrderStatus, update: (status: OrderStatus) => void) => {
  useEffect(() => update(status), [status, update]);
};
