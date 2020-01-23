import {ColumnSpec} from 'components/Table/columnSpecification';
import {TOBColumnData} from 'components/TOB/data';
import strings from 'locales';
import {PriceColumn} from 'columns/tobColumns/priceColumn';
import {SizeColumn} from 'columns/tobColumns/sizeColumn';
import {TenorColumn} from 'columns/tobColumns/tenorColumn';
import {FirmColumn} from 'columns/tobColumns/firmColumn';
import {DarkPoolColumn} from 'columns/tobColumns/darkPoolColumn';

const columns = (data: TOBColumnData, depth: boolean = false): ColumnSpec[] => [
  TenorColumn(data),
  SizeColumn(strings.BidSz, 'bid', data, depth),
  ...(data.isBroker ? [FirmColumn(data, 'bid')] : []),
  PriceColumn(
    data,
    strings.BidPx,
    'bid',
    !depth
      ? {
        fn: data.onRefBidsButtonClicked,
        label: strings.RefBids,
      }
      : undefined,
  ),
  DarkPoolColumn(data),
  PriceColumn(
    data,
    strings.OfrPx,
    'ofr',
    !depth
      ? {
        fn: data.onRefOfrsButtonClicked,
        label: strings.RefOfrs,
      }
      : undefined,
  ),
  ...(data.isBroker ? [FirmColumn(data, 'ofr')] : []),
  SizeColumn(strings.OfrSz, 'ofr', data, depth),
];

export default columns;
