import React, { ReactElement } from "react";
import workareaStore from "../../../../mobx/stores/workareaStore";
import { Currency } from "../../../../interfaces/currency";
import { Select } from "../../../Select";
import { compareCurrencies } from "../../../../columns/messageBlotterColumns/utils";
import { observer } from "mobx-react";
import { CellProps } from "components/MiddleOffice/DealBlotter/props";

export const SymbolCell: React.FC<CellProps> = observer(
  (props: CellProps): ReactElement => {
    const { store, deal } = props;
    const { currencies } = workareaStore;
    if (deal) {
      return <div>{deal.symbol}</div>;
    } else {
      const list: any[] = currencies
        .map((currency: Currency): string => currency.name)
        .sort(compareCurrencies)
        .map((name: string) => {
          return {
            name: name,
            value: name,
          };
        });
      return (
        <Select
          fit={true}
          list={list}
          value={store.currency}
          empty={"Currency"}
          onChange={store.setCurrency}
        />
      );
    }
  }
);
