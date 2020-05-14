import { Message } from "interfaces/message";
import { tenorToNumber } from "utils/dataGenerators";
import { ColumnSpec } from "components/Table/columnSpecification";
import { CellProps } from "./cellProps";

export default (sortable: boolean): ColumnSpec => ({
  name: "Tenor",
  template: "XXXXX",
  filterable: true,
  sortable: sortable,
  header: () => "Tenor",
  render: ({ message: { Tenor } }: CellProps) => Tenor,
  width: 2,
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const original: string = v1.Tenor;
    const value = original.toLowerCase();
    console.log(value, value.startsWith(keyword));
    return value.startsWith(keyword);
  },
  difference: (v1: Message, v2: Message): number => {
    return tenorToNumber(v1.Tenor) - tenorToNumber(v2.Tenor);
  },
});
