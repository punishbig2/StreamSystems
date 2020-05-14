import React, { ReactElement } from "react";
import workareaStore from "../../mobx/stores/workareaStore";
import { Strategy } from "../../interfaces/strategy";
import { Select } from "../../components/Select";
import { CellProps } from "./cellProps";
import { observer } from "mobx-react";

export const StrategyCell: React.FC<CellProps> = observer(
  (props: CellProps): ReactElement => {
    const { store, message } = props;
    const { strategies } = workareaStore;
    if (message) {
      return <div>{message.Strategy}</div>;
    } else {
      const list: any[] = strategies.map(({ name }: Strategy) => {
        return {
          name: name,
          value: name,
        };
      });
      return (
        <Select
          fit={true}
          list={list}
          value={store.strategy}
          empty={"Strategy"}
          onChange={store.setStrategy}
        />
      );
    }
  }
);
