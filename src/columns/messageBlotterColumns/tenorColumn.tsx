import { Message } from 'interfaces/message';
import { tenorToNumber } from 'utils/dataGenerators';
import { ColumnSpec } from 'components/Table/columnSpecification';

export default (sortable: boolean): ColumnSpec => ({
  name: 'Tenor',
  template: 'WW',
  filterable: true,
  sortable: sortable,
  header: () => 'Tenor',
  render: ({ Tenor }: Message) => Tenor,
  width: 2,
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const original: string = v1.Tenor;
    const value = original.toLowerCase();
    return value.includes(keyword);
  },
  difference: (v1: Message, v2: Message): number => {
    return tenorToNumber(v1.Tenor) - tenorToNumber(v2.Tenor);
  },
});
