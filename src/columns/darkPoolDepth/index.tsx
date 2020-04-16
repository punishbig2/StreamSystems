import React from 'react';
import { ColumnSpec } from 'components/Table/columnSpecification';
import { Order, OrderStatus } from 'interfaces/order';
import { xPoints } from 'timesPolygon';

const getSide = ({ bid }: any): string => {
  if (!bid)
    return 'Sell';
  return !!bid.price ? 'Buy' : 'Sell';
};

const columns = (onCancelOrder: (order: Order) => void): ColumnSpec[] => [
  {
    name: 'ref',
    header: () => 'REF',
    render: ({ bid, ofr }: any) => {
      const order: Order = !bid || !bid.price ? ofr : bid;
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
    render: (row: any) => {
      const side: string = getSide(row);
      return <div className={side.toLowerCase()}>{side}</div>;
    },
    width: 2,
    template: '9999999.99',
  },
  {
    name: 'size',
    header: () => 'Qty',
    render: (row: any) => {
      const { bid, ofr } = row;
      const order: Order = !bid || !bid.price ? ofr : bid;
      const side: string = getSide(row);
      console.log(row);
      return <div className={side.toLowerCase()}>{order.size}</div>;
    },
    width: 2,
    template: '99999.99',
  },
];

export default columns;
