import { CellProps } from "components/MiddleOffice/DealBlotter/props";
import React, { ReactElement } from "react";

export const SymbolCell: React.FC<CellProps> = (
  props: CellProps
): ReactElement => {
  const { deal } = props;
  if (deal) {
    // noinspection SuspiciousTypeOfGuard
    if (typeof deal.symbol === "string") {
      return <div>{deal.symbol}</div>;
    } else {
      return <div>{deal.symbol.name}</div>;
    }
  } else {
    return <div />;
  }
};
