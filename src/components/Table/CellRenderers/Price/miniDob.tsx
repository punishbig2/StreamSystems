import {getOrderStatusClass} from 'components/Table/CellRenderers/Price/utils/getOrderStatusClass';
import {OrderTypes} from 'interfaces/mdEntry';
import {Order, OrderStatus} from 'interfaces/order';
import React, {ReactNode} from 'react';
import {priceFormatter} from 'utils/priceFormatter';
import {User} from 'interfaces/user';

interface Props {
  personality: string;
  user: User;
  rows?: Order[];
  type?: OrderTypes;
}

export const MiniDOB: React.FC<Props> = (props: Props) => {
  const {personality, user, rows} = props;
  if (!rows)
    return null;
  const children = rows.map(
    ({price, size, firm, status: originalStatus}: Order, index: number) => {
      const status: OrderStatus = originalStatus &
        ~((personality === firm || !user.isbroker) ? OrderStatus.None : OrderStatus.Owned);
      const priceElement: ReactNode = (() => {
        return (
          <div className={getOrderStatusClass(status, 'mini-price')} key={1}>
            {priceFormatter(price)}
          </div>
        );
      })();
      const elements: ReactNode[] = [priceElement];
      const sizeElement = (
        <div className={getOrderStatusClass(status, 'mini-size')} key={2}>
          {size}
        </div>
      );
      if (props.type === OrderTypes.Bid) {
        elements.unshift(sizeElement);
        if (user.isbroker) {
          elements.unshift(<div key={3} className={'mini-firm'}>{firm}</div>);
        }
      } else {
        elements.push(sizeElement);
        if (user.isbroker) {
          elements.push(<div key={3} className={'mini-firm'}>{firm}</div>);
        }
      }
      return (
        <div className={'row'} key={index}>
          {elements}
        </div>
      );
    },
  );
  return (
    <>
      <div className={'mini-dob'}>{children}</div>
    </>
  );
};
