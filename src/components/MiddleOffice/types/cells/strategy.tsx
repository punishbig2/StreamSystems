import React, { ReactElement } from "react";
import { observer } from "mobx-react";
import { CellProps } from "components/MiddleOffice/DealBlotter/props";

export const StrategyCell: React.FC<CellProps> = observer(
  (props: CellProps): ReactElement => {
    const { deal } = props;
    if (deal) {
      return <div>{deal.strategy}</div>;
    } else {
      return <div />;
    }
  }
);
