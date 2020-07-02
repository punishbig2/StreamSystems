import React, { ReactElement } from "react";
import { Moment } from "moment";
import { Globals } from "golbals";
import { ColumnSpec } from "components/Table/columnSpecification";
import { parseTime, formatters } from "timeUtils";
import { CellProps } from "components/MiddleOffice/DealBlotter/props";
import { Deal } from "components/MiddleOffice/interfaces/deal";


export default (width: number = 6): ColumnSpec => ({
  name: "TransactTime",
  template: "MM/DD/YYYY 00:00:00 pm",
  header: () => "Time",
  filterable: true,
  sortable: true,
  render: (props: CellProps): ReactElement | null | string => {
    const { deal } = props;
    if (deal) {
      const date: Date = parseTime(deal.transactionTime, Globals.timezone);
      return (
        <div className={"date-time-cell"}>
          <span className={"date"}>{formatters.date.format(date)}</span>
          <span className={"time"}>{formatters.time.format(date)}</span>
        </div>
      );
    } else {
      return null;
    }
  },
  width: width,
  difference: (v1: Deal, v2: Deal): number => {
    const m1: Moment = v1.tradeDate;
    const m2: Moment = v2.tradeDate;
    return m1.diff(m2);
  },
  filterByKeyword: (v1: Deal, keyword: string): boolean => {
    const original: string = v1.tradeDate.format();
    if (!original) return false;
    const value: string = origin.toLowerCase();
    return value.includes(keyword.toLowerCase());
  },
});
