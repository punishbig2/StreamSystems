import React, {ReactNode} from 'react';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {TOBColumnData} from 'components/PodTile/data';
import strings from 'locales';
import {OrderColumnWrapper} from 'columns/podColumns/orderColumnWrapper';
import {TenorColumn} from 'columns/podColumns/tenorColumn';
import {FirmColumn} from 'columns/podColumns/firmColumn';
import {DarkPoolColumn} from 'columns/podColumns/darkPoolColumn';
import {OrderTypes} from 'interfaces/mdEntry';
import {API} from 'API';
import {getSideFromType} from 'utils';

interface RefButtonProps {
  type: OrderTypes;
  data: TOBColumnData;
}

const RefButton: React.FC<RefButtonProps> = (props: RefButtonProps) => {
  const labels: { [key: string]: string } = {
    [OrderTypes.Bid]: strings.RefBids,
    [OrderTypes.Ofr]: strings.RefOfrs,
  };
  return <button onClick={cancelAll(props.type, props.data)}>{labels[props.type]}</button>;
};

const cancelAll = (type: OrderTypes, {symbol, strategy}: TOBColumnData) =>
  () => {
    API.cancelAll(symbol, strategy, getSideFromType(type));
  };

const columns = (data: TOBColumnData, depth: boolean = false): ColumnSpec[] => [
  TenorColumn(data),
  ...(data.isBroker ? [FirmColumn(data, 'bid')] : []),
  OrderColumnWrapper(
    strings.BidPx,
    OrderTypes.Bid,
    depth,
    !depth ? ((): ReactNode => <RefButton type={OrderTypes.Bid} data={data}/>) : undefined,
  ),
  DarkPoolColumn(),
  OrderColumnWrapper(
    strings.OfrPx,
    OrderTypes.Ofr,
    depth,
    !depth ? ((): ReactNode => <RefButton type={OrderTypes.Ofr} data={data}/>) : undefined,
  ),
  ...(data.isBroker ? [FirmColumn(data, 'ofr')] : []),
];

export default columns;

