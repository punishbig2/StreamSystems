import React, { ReactElement } from 'react';
import { ColumnSpec } from 'components/Table/columnSpecification';
import { getLink } from 'messageUtils';
import { Message } from 'interfaces/message';
import transactTimeColumn from 'columns/messageBlotterColumns/transactTimeColumn';
import symbolColumn from 'columns/messageBlotterColumns/symbolColumn';
import strategyColumn from 'columns/messageBlotterColumns/strategyColumn';
import sizeColumn from 'columns/messageBlotterColumns/sizeColumn';
import priceColumn from 'columns/messageBlotterColumns/priceColumn';
import { buyerColumn } from 'columns/messageBlotterColumns/buyerColumn';
import { sellerColumn } from 'columns/messageBlotterColumns/sellerColumn';

export const columns: ColumnSpec[] = [{
  name: 'deal-id',
  header: () => 'Deal Id',
  render: (message: Message): ReactElement => {
    if (message) {
      return <div className={'padded'}>{getLink(message)}</div>
    } else {
      return (
        <button><i className={'fa fa-plus'}/> <span>Add</span></button>
      );
    }
  },
  filterable: true,
  width: 3,
  template: '12345',
}, transactTimeColumn(), {
  name: 'status',
  header: () => 'Status',
  render: () => '',
  filterable: true,
  width: 3,
  template: '12345',
},
  symbolColumn(true),
  strategyColumn(true),
  sizeColumn(true),
  priceColumn(true),
  buyerColumn(true),
  sellerColumn(true), {
    name: 'venue',
    header: () => 'Venue',
    render: (message: Message): ReactElement | string => {
      if (message) {
        if (message.ExDestination === 'DP') {
          return 'Dark Pool';
        } else {
          return 'Execution';
        }
      } else {
        return <input/>;
      }
    },
    filterable: true,
    width: 3,
    template: '12345',
  }];
