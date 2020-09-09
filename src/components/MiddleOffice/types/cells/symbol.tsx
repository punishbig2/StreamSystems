import React, { ReactElement } from "react";
import { observer } from "mobx-react";
import { CellProps } from "components/MiddleOffice/DealBlotter/props";

export const SymbolCell: React.FC<CellProps> = observer(
  (props: CellProps): ReactElement => {
    const { deal } = props;
    if (deal) {
      return <div>{deal.symbol}</div>;
    } else {
      return <div />;
    }
  }
);
