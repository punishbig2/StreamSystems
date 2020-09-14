
import { CellProps } from "components/MiddleOffice/DealBlotter/props";
import { Deal } from "components/MiddleOffice/types/deal";
import { ColumnSpec } from "components/Table/columnSpecification";
import moment, { Moment } from "moment";
import React, { ReactElement } from "react";
import { DateFormatter, TimeFormatter } from "utils/timeUtils";

export default (width: number = 6): ColumnSpec => ({
  name: "TransactTime",
  template: "MM/DD/YYYY 00:00:00 pm",
  header: () => "Time",
  filterable: true,
  sortable: true,
  render: (props: CellProps): ReactElement | null | string => {
    const { deal } = props;
    if (deal) {
      const date: Date = deal.tradeDate;
      return (
        <div className={"date-time-cell"}>
          <span className={"date"}>{DateFormatter.format(date)}</span>
          <span className={"time"}>{TimeFormatter.format(date)}</span>
        </div>
      );
    } else {
      return null;
    }
  },
  width: width,
  difference: (v1: Deal, v2: Deal): number => {
    const m1: Moment = moment(v1.tradeDate);
    const m2: Moment = moment(v2.tradeDate);
    return m1.diff(m2);
  },
  filterByKeyword: (v1: Deal, keyword: string): boolean => {
    const original: string = DateFormatter.format(v1.tradeDate);
    if (!original) return false;
    const value: string = origin.toLowerCase();
    return value.includes(keyword.toLowerCase());
  },
});
