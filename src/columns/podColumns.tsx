import React, { ReactElement } from 'react';
import { ColumnSpec } from 'components/Table/columnSpecification';
import strings from 'locales';
import { OrderColumnWrapper } from 'columns/podColumns/orderColumnWrapper';
import { TenorColumn } from 'columns/podColumns/tenorColumn';
import { FirmColumn } from 'columns/podColumns/firmColumn';
import { DarkPoolColumn } from 'columns/podColumns/darkPoolColumn';
import { OrderTypes } from 'interfaces/mdEntry';
import { API } from 'API';
import { getSideFromType } from 'utils';
import { User } from 'interfaces/user';

interface RefButtonProps {
  type: OrderTypes;
  strategy: string;
  symbol: string;
  user: User;
}

const RefButton: React.FC<RefButtonProps> = (props: RefButtonProps) => {
  const labels: { [key: string]: string } = {
    [OrderTypes.Bid]: strings.RefBids,
    [OrderTypes.Ofr]: strings.RefOfrs,
  };
  return <button
    onClick={cancelAll(props.type, props.symbol, props.strategy, props.user)}>{labels[props.type]}</button>;
};

const cancelAll = (type: OrderTypes, symbol: string, strategy: string, user: User) =>
  () => {
    API.cancelAll(symbol, strategy, getSideFromType(type), user);
  };

const getRefButton = (depth: boolean, symbol: string, strategy: string, user: User, type: OrderTypes): (() => ReactElement | null) => {
  if (depth)
    return () => null;
  return () => <RefButton type={type} symbol={symbol} strategy={strategy} user={user}/>;
};

const columns = (symbol: string, strategy: string, user: User, depth: boolean = false): ColumnSpec[] => [
  TenorColumn(),
  ...(user.isbroker ? [FirmColumn(OrderTypes.Bid)] : []),
  OrderColumnWrapper(
    strings.BidPx,
    OrderTypes.Bid,
    depth,
    getRefButton(depth, symbol, strategy, user, OrderTypes.Bid),
  ),
  DarkPoolColumn(),
  OrderColumnWrapper(
    strings.OfrPx,
    OrderTypes.Ofr,
    depth,
    getRefButton(depth, symbol, strategy, user, OrderTypes.Ofr),
  ),
  ...(user.isbroker ? [FirmColumn(OrderTypes.Ofr)] : []),
];

export default columns;

