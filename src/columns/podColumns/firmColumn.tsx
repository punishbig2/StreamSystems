import { PodRowProps } from 'columns/podColumns/common';
import { getRelevantOrders } from 'columns/podColumns/OrderColumn/helpers/getRelevantOrders';
import { TableColumn } from 'components/Table/tableColumn';
import React, { ReactElement } from 'react';
import { OrderTypes } from 'types/mdEntry';
import { Order, OrderStatus } from 'types/order';

type Props = PodRowProps & {
  readonly type: OrderTypes;
};

const Component: React.FC<Props> = (props: Props): ReactElement | null => {
  const { type, orders: originalOrders } = props;
  const orders: readonly Order[] = React.useMemo(
    (): readonly Order[] => getRelevantOrders(originalOrders, type),
    [originalOrders, type]
  );
  // It should never happen that this is {} as Order
  const { currency, strategy, tenor } = props;
  const order: Order = React.useMemo(
    (): Order =>
      orders.length > 0 ? orders[0] : new Order(tenor, currency, strategy, '', null, type),
    [currency, orders, strategy, tenor, type]
  );
  if (!order) return null;
  const { firm, status } = order;
  if ((status & OrderStatus.Cancelled) !== 0) return null;
  return <div className="firm">{firm}</div>;
};

export const FirmColumn = (type: OrderTypes): TableColumn => ({
  name: `${type}-firm`,
  header: () => <div>&nbsp;</div>,
  render: (row: PodRowProps) => <Component type={type} {...row} />,
  template: ' BANK ',
  width: 4,
});
