import React from 'react';
import { Message } from 'interfaces/message';
import { ColumnSpec } from 'components/Table/columnSpecification';
import { DarkPool } from 'interfaces/w';
import { CellProps } from './cellProps';

export const poolColumn = (sortable: boolean): ColumnSpec => ({
  name: 'pool',
  difference: function (p1: any, p2: any) {
    return 0;
  },
  filterByKeyword: function (p1: any, p2: string) {
    return false;
  },
  header: () => 'Venue',
  render: (props: CellProps) => {
    const { ExDestination } = props.message;
    return (
      <div className={'message-blotter-cell normal'}>{ExDestination === DarkPool ? 'Dark Pool' : ''}&nbsp;</div>
    )
  },
  filterable: true,
  sortable: sortable,
  template: 'MAKE_IT_WIDE_AND_WIDER',
  width: 3,
});
