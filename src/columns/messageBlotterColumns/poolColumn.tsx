import React from 'react';
import {Message} from 'interfaces/message';

export const poolColumn = (sortable: boolean) => ({
  name: 'pool',
  difference: function (p1: any, p2: any) {
    return 0;
  },
  filterByKeyword: function (p1: any, p2: string) {
    return false;
  },
  header: () => <div>Venue</div>,
  render: ({ExDestination}: Message) => <div className={'message-blotter-cell normal'}>{ExDestination}&nbsp;</div>,
  filterable: true,
  sortable: sortable,
  template: 'MAKE_IT_WIDE_AND_WIDER',
  weight: 2,
});
