import {OrderStatus} from 'interfaces/order';
import {useEffect} from 'react';

export const useStatusUpdater = (status: OrderStatus, update: (status: OrderStatus) => void) => {
  useEffect(() => update(status), [status, update]);
};
