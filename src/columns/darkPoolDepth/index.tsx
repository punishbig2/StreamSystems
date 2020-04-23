import React from 'react';
import { ColumnSpec } from 'components/Table/columnSpecification';
import { Order, OrderStatus } from 'interfaces/order';
import { xPoints } from 'timesPolygon';
import { OrderTypes } from 'interfaces/mdEntry';

const getSide = (order: Order): string => {
  if (order.type === OrderTypes.Ofr)
    return 'Sell';
  return 'Buy';
};

const columns = (onCancelOrder: (order: Order) => void): ColumnSpec[] => [
  {
    name: 'ref',
    header: () => 'REF',
    render: (order: Order) => {
      const classes: string[] = ['times'];
      if ((order.status & OrderStatus.Owned) !== 0)
        classes.push('clickable');
      return (
        <div key={2} className={classes.join(' ')} onClick={() => onCancelOrder(order)}>
          <svg viewBox={'0 0 612 792'}>
            <g>
              <polygon className={'st0'} points={xPoints}/>
            </g>
          </svg>
        </div>
      );
    },
    width: 1,
    template: 'XXXX',
  },
  {
    name: 'side',
    header: () => 'Side',
    render: (row: Order) => {
      const side: string = getSide(row);
      return <div className={side.toLowerCase()}>{side}</div>;
    },
    width: 2,
    template: '9999999.99',
  },
  {
    name: 'size',
    header: () => 'Qty',
    render: (order: Order) => {
      const side: string = getSide(order);
      return <div className={side.toLowerCase()} title={order.user}>{order.size}</div>;
    },
    width: 2,
    template: '99999.99',
  },
];

export default columns;
