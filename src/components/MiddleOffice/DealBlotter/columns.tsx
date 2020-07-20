import React, { ReactElement } from "react";
import { ColumnSpec } from "components/Table/columnSpecification";
import transactTimeColumn from "components/MiddleOffice/interfaces/columnTypes/transactionTime";
import { CellProps } from "components/MiddleOffice/DealBlotter/props";
import strategyColumn from "components/MiddleOffice/interfaces/columnTypes/strategy";
import symbolColumn from "components/MiddleOffice/interfaces/columnTypes/symbol";
import priceColumn from "components/MiddleOffice/interfaces/columnTypes/price";
import sizeColumn from "components/MiddleOffice/interfaces/columnTypes/size";
import sellerColumn from "components/MiddleOffice/interfaces/columnTypes/seller";
import buyerColumn from "components/MiddleOffice/interfaces/columnTypes/buyer";
import { Deal } from "components/MiddleOffice/interfaces/deal";
import { parseTenor } from "utils/timeUtils";
import { stateMap } from "utils/dealUtils";

export const columns: ColumnSpec[] = [
  {
    name: "deal-id",
    header: () => "Deal Id",
    render: (props: CellProps): ReactElement | null => {
      const { deal } = props;
      if (deal) {
        return <div className={"padded"}>{deal.dealID}</div>;
      } else {
        return null;
      }
    },
    filterByKeyword: (v1: Deal, keyword: string): boolean => {
      return v1.dealID.includes(keyword.toLowerCase());
    },
    difference: (v1: Deal, v2: Deal) => {
      const s1: string = v1.dealID;
      return s1.localeCompare(v2.dealID);
    },
    filterable: true,
    width: 9,
    template: "12345",
  },
  transactTimeColumn(6),
  strategyColumn(true, 3),
  {
    name: "status",
    header: () => "Status",
    render: ({ deal }: CellProps) => {
      return stateMap[deal.status];
    },
    filterable: true,
    filterByKeyword: (v1: Deal, keyword: string): boolean => {
      const value: string = stateMap[v1.status];
      const lowerCaseValue: string = value.toLowerCase();
      return lowerCaseValue.includes(keyword.toLowerCase());
    },
    difference: (v1: Deal, v2: Deal) => {
      const value1: string = stateMap[v1.status];
      const value2: string = stateMap[v2.status];
      return value1.localeCompare(value2);
    },
    sortable: true,
    width: 3,
    template: "12345",
  },
  symbolColumn(true),
  {
    name: "tenor",
    header: () => "Tenor",
    render: ({ deal }: CellProps) => {
      return <div>{parseTenor(deal.tenor)}</div>;
    },
    filterable: true,
    width: 2,
    template: "XX",
  },
  priceColumn(true, 2),
  sizeColumn(true, 2),
  buyerColumn(true),
  sellerColumn(true),
  {
    name: "venue",
    header: () => "Venue",
    render: (props: CellProps): ReactElement | string | null => {
      const { deal } = props;
      if (!deal) return null;
      return deal.source;
    },
    filterable: true,
    width: 3,
    template: "12345",
    filterByKeyword: (v1: Deal, keyword: string): boolean => {
      const lowerCaseSource: string = v1.source.toLowerCase();
      return lowerCaseSource.includes(keyword.toLowerCase());
    },
    difference: (v1: Deal, v2: Deal) => {
      const s1: string = v1.source;
      return s1.localeCompare(v2.source);
    },
  },
];
