import React, { ReactElement } from "react";
import workareaStore from "../../mobx/stores/workareaStore";
import { Currency } from "../../interfaces/currency";
import { Select } from "../../components/Select";
import { compareCurrencies } from "./utils";
import { CellProps } from "./cellProps";
import { observer } from "mobx-react";

export const SymbolCell: React.FC<CellProps> = observer(
  (props: CellProps): ReactElement => {
    const { store, message } = props;
    const { currencies } = workareaStore;
    if (message) {
      return <div>{message.Symbol}</div>;
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
