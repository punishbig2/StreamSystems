import {TOBColumnData} from 'components/PodTile/data';
import {DualTableHeader} from 'components/dualTableHeader';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {Order, OrderStatus} from 'interfaces/order';
import {TOBPrice} from 'columns/tobPrice';
import React, {ReactNode} from 'react';
import {getChevronStatus, Type, RowType, getBankMatchesPersonalityStatus} from 'columns/tobColumns/common';
import {STRM} from 'redux/stateDefs/workspaceState';
import {User} from 'interfaces/user';
import {getAuthenticatedUser} from 'utils/getCurrentUser';

const getPriceIfApplies = (order: Order | undefined): number | undefined => {
  if (order === undefined) return undefined;
  if ((order.status & OrderStatus.SameBank) !== 0) return order.price as number;
  return undefined;
};

const canDoubleClick = (order: Order, personality: string) => {
  const user: User = getAuthenticatedUser();
  if (user.isbroker && personality === STRM)
    return false;
  return order.price !== null && order.quantity !== null;
};

export const PriceColumn = (data: TOBColumnData, label: string, type: Type, action?: () => ReactNode): ColumnSpec => {
  return {
    name: `${type}-vol`,
    header: () => (
      <DualTableHeader label={label} action={action} disabled={!data.buttonsEnabled}/>
    ),
    render: (row: RowType) => {
      const {[type]: order, depths} = row;
      const bid: Order | undefined = type === 'ofr' ? row.bid : undefined;
      const ofr: Order | undefined = type === 'bid' ? row.ofr : undefined;
      const status: OrderStatus = getChevronStatus(depths, order.tenor, order.type)
        | getBankMatchesPersonalityStatus(order, data.personality)
        | order.status
      ;
      return (
        <TOBPrice
          depths={depths}
          order={{...order, status}}
          min={getPriceIfApplies(bid)}
          max={getPriceIfApplies(ofr)}
          readOnly={data.isBroker && data.personality === STRM}
          onChange={data.onOrderModified}
          onTabbedOut={data.onTabbedOut}
          onDoubleClick={canDoubleClick(order, data.personality) ? data.onDoubleClick : undefined}
          onError={data.onOrderError}
          onNavigate={data.onNavigate}/>
      );
    },
    template: '999999.999',
    weight: 7,
  };
};
