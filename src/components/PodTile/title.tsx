import { Select } from "components/Select";
import { CCYGroupTags, CCYPair, RRStrategy, Tag } from "data/groups";
import strings from "locales";
import { observer } from "mobx-react";
import { PodTileStore } from "mobx/stores/podTileStore";
import workareaStore from "mobx/stores/workareaStore";
import React, { ReactElement } from "react";
import { STRM } from "stateDefs/workspaceState";
import { Symbol } from "types/symbol";
import { User } from "types/user";
import { isCCYPair, isRRStrategy } from "utils/isInEnum";
import { Strategy } from "types/strategy";

interface Props {
  readonly store: PodTileStore;
  readonly currencies: ReadonlyArray<Symbol>;
  readonly strategies: ReadonlyArray<Strategy>;
}

export const PodTileTitle: React.FC<Props> = observer(
  (props: Props): ReactElement => {
    const { store } = props;
    const { currency, strategy } = store;

    const personality: string = workareaStore.personality;

    const getTag = (pair: string, strategy: string): string => {
      if (!isCCYPair(pair)) return " ";
      const group: { [strategy in RRStrategy]: Tag } | undefined =
        CCYGroupTags[pair as CCYPair];
      if (group === undefined) return " ";
      if (!isRRStrategy(strategy)) return " ";
      return group[strategy];
    };

    const user: User = workareaStore.user;
    const isRunButtonDisabled: boolean =
      !currency || !strategy || (personality === STRM && user.isbroker);

    return (
      <>
        <div className={"item"}>
          <Select
            value={currency}
            onChange={store.setCurrency}
            list={props.currencies}
            empty={"Currency"}
            searchable={true}
          />
        </div>
        <div className={"item"}>
          <Select
            value={strategy}
            onChange={store.setStrategy}
            list={props.strategies}
            empty={"Strategy"}
          />
        </div>
        <div className={"ccy-group"}>{getTag(currency, strategy)}</div>
        <div className={"item"}>
          <button onClick={store.showRunWindow} disabled={isRunButtonDisabled}>
            {strings.Run}
          </button>
        </div>
      </>
    );
  }
);
