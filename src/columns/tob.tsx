import React, {ReactNode} from 'react';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {TOBColumnData} from 'components/PodTile/data';
import strings from 'locales';
import {OrderColumnWrapper} from 'columns/podColumns/orderColumnWrapper';
import {TenorColumn} from 'columns/podColumns/tenorColumn';
import {FirmColumn} from 'columns/podColumns/firmColumn';
import {DarkPoolColumn} from 'columns/podColumns/darkPoolColumn';
import {OrderTypes} from 'interfaces/mdEntry';

const columns = (data: TOBColumnData, depth: boolean = false): ColumnSpec[] => [
  TenorColumn(data),
  ...(data.isBroker ? [FirmColumn(data, 'bid')] : []),
  OrderColumnWrapper(
    data,
    strings.BidPx,
    OrderTypes.Bid,
    depth,
    !depth ? ((): ReactNode => <button onClick={data.onRefBidsButtonClicked}>{strings.RefBids}</button>) : undefined,
  ),
  DarkPoolColumn(data),
  OrderColumnWrapper(
    data,
    strings.OfrPx,
    OrderTypes.Ofr,
    depth,
    !depth ? ((): ReactNode => <button onClick={data.onRefOfrsButtonClicked}>{strings.RefOfrs}</button>) : undefined,
  ),
  ...(data.isBroker ? [FirmColumn(data, 'ofr')] : []),
];

export default columns;
