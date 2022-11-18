import React from 'react';
import { OrderTypes } from 'types/mdEntry';
import { Order } from 'types/order';
import { PodRow, PodRowStatus } from 'types/podRow';
import { PodTable } from 'types/podTable';
import { User } from 'types/user';

export const useDobRows = (
  originalRows: PodTable,
  tenor: string | null,
  symbol: string,
  strategy: string,
  user: User
): PodTable => {
  return React.useMemo((): PodTable => {
    if (tenor === null || strategy === undefined) {
      return originalRows;
    }

    const additionalRow: PodRow = {
      id: '#special',
      tenor: tenor,
      bid: new Order(tenor, symbol, strategy, user.email, null, OrderTypes.Bid),
      ofr: new Order(tenor, symbol, strategy, user.email, null, OrderTypes.Ofr),
      mid: null,
      spread: null,
      status: PodRowStatus.Normal,
      darkPrice: null,
    };

    return {
      ...originalRows,
      '#special': additionalRow,
    };
  }, [tenor, symbol, strategy, user, originalRows]);
};
