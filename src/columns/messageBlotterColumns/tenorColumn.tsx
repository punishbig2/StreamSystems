import {Message} from 'interfaces/message';
import React from 'react';
import {tenorToNumber} from 'utils/dataGenerators';

export default (filterAndSort: boolean) => ({
  name: 'Tenor',
  template: 'WW',
  filterable: filterAndSort,
  sortable: filterAndSort,
  header: () => <div>Tenor</div>,
  render: ({Tenor}: Message) => (
    <div className={'message-blotter-cell normal'}>{Tenor}</div>
  ),
  weight: 2,
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const original: string = v1.Tenor;
    const value = original.toLowerCase();
    return value.includes(keyword);
  },
  difference: (v1: Message, v2: Message): number => {
    return tenorToNumber(v1.Tenor) - tenorToNumber(v2.Tenor);
  },
});
