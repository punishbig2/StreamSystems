import { Message } from 'interfaces/message';
import { ColumnSpec } from 'components/Table/columnSpecification';

const currencyToNumber = (value: string) => {
  return 1000 * value.charCodeAt(0) + value.charCodeAt(3);
};

export default (sortable: boolean): ColumnSpec => ({
  name: 'Currency',
  template: '  XXXXXX  ',
  filterable: true,
  sortable: sortable,
  header: () => 'Currency',
  render: ({ Symbol }: Message) => Symbol,
  width: 3,
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const original: string = v1.Symbol;
    if (!original) return false;
    const value = original.toLowerCase();
    return value.includes(keyword);
  },
  difference: (v1: Message, v2: Message): number => {
    if (!v1.Symbol || !v2.Symbol) return 0;
    return currencyToNumber(v1.Symbol) - currencyToNumber(v2.Symbol);
  },
});
