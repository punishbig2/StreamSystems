import React, { ReactElement } from "react";
import { ColumnSpec } from "components/Table/columnSpecification";
import transactTimeColumn from "components/MiddleOffice/types/columnTypes/transactionTime";
import { CellProps } from "components/MiddleOffice/DealBlotter/props";
import strategyColumn from "components/MiddleOffice/types/columnTypes/strategy";
import symbolColumn from "components/MiddleOffice/types/columnTypes/symbol";
import priceColumn from "components/MiddleOffice/types/columnTypes/price";
import sizeColumn from "components/MiddleOffice/types/columnTypes/size";
import sellerColumn from "components/MiddleOffice/types/columnTypes/seller";
import buyerColumn from "components/MiddleOffice/types/columnTypes/buyer";
import { Deal } from "components/MiddleOffice/types/deal";
import { stateMap } from "utils/dealUtils";

export const columns: ColumnSpec[] = [
  {
    name: "deal-id",
    header: () => "Deal Id",
    render: (props: CellProps): ReactElement | null => {
      const { deal } = props;
      if (deal) {
        return <div className={"padded"}>{deal.id}</div>;
      } else {
        return null;
      }
    },
    filterByKeyword: (v1: Deal, keyword: string): boolean => {
      return v1.id.includes(keyword.toLowerCase());
    },
    difference: (v1: Deal, v2: Deal) => {
      const s1: string = v1.id;
      return s1.localeCompare(v2.id);
    },
    filterable: true,
    width: 10,
    template: "12345",
  },
  transactTimeColumn(6),
  strategyColumn(true, 5),
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
    render: ({ deal: { tenor1: tenor } }: CellProps) => {
      return <div>{tenor.name}</div>;
    },
    filterable: true,
    width: 3,
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
