import { makeStyles } from "@material-ui/core/styles";
import { CellProps } from "components/MiddleOffice/DealBlotter/props";
import buyerColumn from "components/MiddleOffice/types/columnTypes/buyer";
import priceColumn from "components/MiddleOffice/types/columnTypes/price";
import sellerColumn from "components/MiddleOffice/types/columnTypes/seller";
import sizeColumn from "components/MiddleOffice/types/columnTypes/size";
import strategyColumn from "components/MiddleOffice/types/columnTypes/strategy";
import symbolColumn from "components/MiddleOffice/types/columnTypes/symbol";
import transactTimeColumn from "components/MiddleOffice/types/columnTypes/transactionTime";
import { Deal } from "components/MiddleOffice/types/deal";
import { ColumnSpec } from "components/Table/columnSpecification";
import React, { ReactElement } from "react";
import { stateMap } from "utils/dealUtils";
import { Tooltip } from "@material-ui/core";

const useErrorTooltipStyle = makeStyles(() => ({
  arrow: {
    color: "darkred",
  },
  tooltip: {
    color: "white",
    backgroundColor: "darkred",
    fontSize: 15,
  },
}));

const StatusCell: React.FC<{ deal: Deal }> = ({
  deal,
}: {
  deal: Deal;
}): React.ReactElement => {
  const classes = useErrorTooltipStyle();
  console.log(deal.error_msg);
  if (!deal.error_msg) return <div>{stateMap[deal.status]}</div>;
  return (
    <Tooltip title={deal.error_msg} classes={classes} arrow>
      <div>{stateMap[deal.status]}</div>
    </Tooltip>
  );
};

const getSource = (deal: Deal): string => {
  if (deal.isdarkpool) {
    return "Dark Pool";
  } else {
    return deal.source;
  }
};

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
    filterByKeyword: ({ id }: Deal, keyword: string): boolean => {
      const lowerCaseId: string = id.toLowerCase();
      return lowerCaseId.includes(keyword.toLowerCase());
    },
    difference: ({ id: id1 }: Deal, { id: id2 }: Deal) => {
      const lcId1: string = id1.toLowerCase();
      const lcId2: string = id2.toLowerCase();
      return lcId1.localeCompare(lcId2);
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
    render: ({ deal }: CellProps): React.ReactElement => (
      <StatusCell deal={deal} />
    ),
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
      return <div>{tenor}</div>;
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
      return getSource(props.deal);
    },
    filterable: true,
    width: 3,
    template: "12345",
    filterByKeyword: (v1: Deal, keyword: string): boolean => {
      const source: string = getSource(v1);
      const lowerCaseSource: string = source.toLowerCase();
      return lowerCaseSource.includes(keyword.toLowerCase());
    },
    difference: (v1: Deal, v2: Deal) => {
      const s1: string = getSource(v1);
      return s1.localeCompare(getSource(v2));
    },
  },
];
