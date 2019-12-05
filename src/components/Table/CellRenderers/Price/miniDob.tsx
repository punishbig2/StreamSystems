import {EntryTypes} from 'interfaces/mdEntry';
import {Order, OrderStatus} from 'interfaces/order';
import React, {ReactNode} from 'react';
import {priceFormatter} from 'utils/priceFormatter';

interface Props {
  type?: EntryTypes;
  rows?: Order[];
}

export const MiniDOB: React.FC<Props> = (props: Props) => {
  const {rows} = props;
  if (!rows)
    return null;
  const children = rows.map(({price, quantity, status}: Order, index: number) => {
    const priceElement: ReactNode = (() => {
      const classes: string[] = ['mini-price'];
      if ((status & OrderStatus.Owned) !== 0)
        classes.push('owned');
      return (
        <div className={classes.join(' ')} key={1}>
          {priceFormatter(price)}
        </div>
      );
    })();
    const elements: ReactNode[] = [priceElement];
    const sizeElement = (
      <div className={'mini-size'} key={2}>
        {quantity}
      </div>
    );
    if (props.type === EntryTypes.Bid)
      elements.unshift(sizeElement);
    else
      elements.push(sizeElement);
    return (
      <div className={'row'} key={index}>
        {elements}
      </div>
    );
  });
  return (
    <React.Fragment>
      <div className={'mini-dob'}>
        {children}
      </div>
    </React.Fragment>
  );
};
