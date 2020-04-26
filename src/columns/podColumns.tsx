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
import workareaStore from 'mobx/stores/workareaStore';

interface RefButtonProps {
  type: OrderTypes;
  strategy: string;
  symbol: string;
}

const RefButton: React.FC<RefButtonProps> = (props: RefButtonProps) => {
  const labels: { [key: string]: string } = {
    [OrderTypes.Bid]: strings.RefBids,
    [OrderTypes.Ofr]: strings.RefOfrs,
  };
  return (
    <div className={'button-container'}>
      <button onClick={cancelAll(props.type, props.symbol, props.strategy)}>{labels[props.type]}</button>
    </div>
  );
};

const cancelAll = (type: OrderTypes, symbol: string, strategy: string) =>
  () => {
    const user: User = workareaStore.user;
    if (user.isbroker) {
      API.cancelAllExtended(symbol, strategy, getSideFromType(type));
    } else {
      API.cancelAll(symbol, strategy, getSideFromType(type));
    }
  };

const getRefButton = (depth: boolean, symbol: string, strategy: string, type: OrderTypes): (() => ReactElement | null) => {
  if (depth)
    return () => null;
  return () => <RefButton type={type} symbol={symbol} strategy={strategy}/>;
};

const columns = (symbol: string, strategy: string, depth: boolean = false): ColumnSpec[] => {
  const user: User = workareaStore.user;
  return [
    TenorColumn(),
    ...(user.isbroker ? [FirmColumn(OrderTypes.Bid)] : []),
    OrderColumnWrapper(
      strings.BidPx,
      OrderTypes.Bid,
      depth,
      getRefButton(depth, symbol, strategy, OrderTypes.Bid),
    ),
    DarkPoolColumn(),
    OrderColumnWrapper(
      strings.OfrPx,
      OrderTypes.Ofr,
      depth,
      getRefButton(depth, symbol, strategy, OrderTypes.Ofr),
    ),
    ...(user.isbroker ? [FirmColumn(OrderTypes.Ofr)] : []),
  ];
};

export default columns;

