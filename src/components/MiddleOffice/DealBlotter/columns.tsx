import React from 'react';
import { ColumnSpec } from 'components/Table/columnSpecification';
import { getMessageSize, getMessagePrice, getMessageBuyer, getMessageSeller, getLink } from 'messageUtils';
import { sizeFormatter } from 'utils/sizeFormatter';
import { priceFormatter } from 'utils/priceFormatter';
import { Message } from 'interfaces/message';

export const columns: ColumnSpec[] = [{
  name: 'deal-id',
  header: () => 'Deal Id',
  render: (props: Message): string => getLink(props),
  filterable: true,
  width: 4,
  template: '12345',
}, {
  name: 'status',
  header: () => 'Status',
  render: () => '',
  filterable: true,
  width: 4,
  template: '12345',
}, {
  name: 'currency',
  header: () => 'Currency',
  render: (props: Message) => props.Symbol,
  filterable: true,
  width: 4,
  template: '12345',
}, {
  name: 'strategy',
  header: () => 'Strategy',
  render: (props: Message) => props.Strategy,
  filterable: true,
  width: 4,
  template: '12345',
}, {
  name: 'size',
  header: () => 'Size',
  render: (props: Message) => sizeFormatter(getMessageSize(props)),
  filterable: true,
  width: 4,
  template: '12345',
}, {
  name: 'level',
  header: () => 'Level',
  render: (props: Message) => priceFormatter(getMessagePrice(props)),
  filterable: true,
  width: 4,
  template: '12345',
}, {
  name: 'buyer',
  header: () => 'Buyer',
  render: (props: Message) => getMessageBuyer(props),
  filterable: true,
  width: 4,
  template: '12345',
}, {
  name: 'seller',
  header: () => 'Seller',
  render: (props: Message) => getMessageSeller(props),
  filterable: true,
  width: 4,
  template: '12345',
}, {
  name: 'venue',
  header: () => 'Venue',
  render: () => 'Executions',
  filterable: true,
  width: 4,
  template: '12345',
}];
