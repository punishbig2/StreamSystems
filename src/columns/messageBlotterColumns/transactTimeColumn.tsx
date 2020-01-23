import { Message } from "interfaces/message";
import moment, { Moment } from "moment";
import React from "react";

const INCOMING_DATE_FORMAT: string = "YYYYMMDD-hh:mm:ss";
const DISPLAY_DATE_FORMAT: string = "MM-DD-YYYY hh:mm a";

export default (sortable: boolean) => ({
  name: "TransactTime",
  template: "MM/DD/YYYY 00:00:00",
  header: () => <div>Time (EST)</div>,
  filterable: true,
  sortable: sortable,
  render: (data: Message) => {
    return (
      <div className={"message-blotter-cell time"}>
        {moment(data.TransactTime, INCOMING_DATE_FORMAT).format(
          DISPLAY_DATE_FORMAT
        )}
      </div>
    );
  },
  weight: 4,
  difference: (v1: Message, v2: Message): number => {
    const m1: Moment = moment(v1.TransactTime, INCOMING_DATE_FORMAT);
    const m2: Moment = moment(v2.TransactTime, INCOMING_DATE_FORMAT);
    return m1.diff(m2);
  },
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const original: string = v1.TransactTime;
    if (!original) return false;
    const value: string = origin.toLowerCase();
    return value.includes(keyword);
  }
});
