import React from "react";
import { Message } from "interfaces/message";

export const poolColumn = (sortable: boolean) => ({
  name: "pool",
  difference: function(p1: any, p2: any) {
    return 0;
  },
  filterByKeyword: function(p1: any, p2: string) {
    return false;
  },
  header: () => <div>Pool</div>,
  render: ({ ExDestination }: Message) => <div>{ExDestination}</div>,
  filterable: true,
  sortable: sortable,
  template: "POOL_AND_SORT",
  weight: 1
});
