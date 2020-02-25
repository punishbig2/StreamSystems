import React, {ReactNode} from 'react';
import {ColumnSpec} from 'components/Table/columnSpecification';
import strings from 'locales';
import {OrderColumnWrapper} from 'columns/podColumns/orderColumnWrapper';
import {TenorColumn} from 'columns/podColumns/tenorColumn';
import {FirmColumn} from 'columns/podColumns/firmColumn';
import {DarkPoolColumn} from 'columns/podColumns/darkPoolColumn';
import {OrderTypes} from 'interfaces/mdEntry';
import {API} from 'API';
import {getSideFromType} from 'utils';
import {getAuthenticatedUser} from 'utils/getCurrentUser';
import {User} from 'interfaces/user';

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
  return <button onClick={cancelAll(props.type, props.symbol, props.strategy)}>{labels[props.type]}</button>;
};

const cancelAll = (type: OrderTypes, symbol: string, strategy: string) =>
  () => {
    API.cancelAll(symbol, strategy, getSideFromType(type));
  };

const user: User = getAuthenticatedUser();

const columns = (symbol: string, strategy: string, isBroker: boolean, depth: boolean = false): ColumnSpec[] => [
  TenorColumn(),
  ...(isBroker ? [FirmColumn('bid')] : []),
  OrderColumnWrapper(
    strings.BidPx,
    OrderTypes.Bid,
    depth,
    !depth ? ((): ReactNode => <RefButton type={OrderTypes.Bid} symbol={symbol} strategy={strategy}/>) : undefined,
  ),
  DarkPoolColumn(),
  OrderColumnWrapper(
    strings.OfrPx,
    OrderTypes.Ofr,
    depth,
    !depth ? ((): ReactNode => <RefButton type={OrderTypes.Ofr} symbol={symbol} strategy={strategy}/>) : undefined,
  ),
  ...(isBroker ? [FirmColumn('ofr')] : []),
];

export default columns;

