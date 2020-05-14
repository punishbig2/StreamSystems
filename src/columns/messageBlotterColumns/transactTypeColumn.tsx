import { ExecTypes, Message } from "interfaces/message";
import { CellProps } from "./cellProps";

const TransTypes: { [key: string]: string } = {
  [ExecTypes.New]: "New",
  [ExecTypes.Canceled]: "Cancel",
  [ExecTypes.PartiallyFilled]: "Partially Filled",
  [ExecTypes.Filled]: "Filled",
  [ExecTypes.Replace]: "Replace",
  [ExecTypes.PendingCancel]: "Pending Cancel",
};

export default (sortable: boolean) => ({
  name: "ExecTransType",
  template: "Long String to Fit the content",
  header: () => "Type",
  filterable: true,
  sortable: sortable,
  render: (props: CellProps) => {
    const { message: data } = props;
    if (TransTypes[data.OrdStatus]) {
      return TransTypes[data.OrdStatus];
    } else {
      return data.OrdStatus;
    }
  },
  width: 3,
  difference: (v1: Message, v2: Message): number => {
    return Number(v1.OrdStatus) - Number(v2.OrdStatus);
  },
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const original: string = TransTypes[v1.OrdStatus];
    if (!original) return false;
    const value = original.toLowerCase();
    return value.includes(keyword);
  },
});
