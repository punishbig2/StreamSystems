import { useGlow } from "components/PodTile/hooks/useGlow";
import { Select } from "components/Select";
import strings from "locales";
import { observer } from "mobx-react";
import { PodTileStore } from "mobx/stores/podTileStore";
import workareaStore from "mobx/stores/workareaStore";
import React, { ReactElement, useMemo } from "react";
import { STRM } from "stateDefs/workspaceState";
import { Product } from "types/product";
import { Role } from "types/role";
import { Symbol } from "types/symbol";
import { User } from "types/user";

interface Props {
  readonly store: PodTileStore;
  readonly currencies: ReadonlyArray<Symbol>;
  readonly strategies: ReadonlyArray<Product>;
}

export const PodTileTitle: React.FC<Props> = observer(
  (props: Props): ReactElement => {
    const { store } = props;
    const { currency, strategy } = store;

    const personality: string = workareaStore.personality;

    const user: User = workareaStore.user;
    const isBroker: boolean = useMemo((): boolean => {
      const { roles } = user;
      return roles.includes(Role.Broker);
    }, [user]);
    const isRunButtonDisabled: boolean =
      !currency || !strategy || (personality === STRM && isBroker);
    const { currencies, strategies } = props;

    const glowing: boolean = useGlow(store.orders);

    return (
      <>
        <div className={["glow", ...(glowing ? ["glowing"] : [])].join(" ")} />
        <div className={"item"}>
          <Select
            value={currency}
            onChange={store.setCurrency}
            list={currencies.map((item: Symbol): { name: string } => ({
              name: item.name,
            }))}
            empty={"Currency"}
            searchable={true}
          />
        </div>
        <div className={"item"}>
          <Select
            value={strategy}
            onChange={store.setStrategy}
            list={strategies.map((item: Product): {
              name: string;
            } => ({
              name: item.name,
            }))}
            empty={"Strategy"}
          />
        </div>
        {/* <div className={"ccy-group"}>{getTag(currency, strategy)}</div> */}
        <div className={"item"}>
          <button onClick={store.showRunWindow} disabled={isRunButtonDisabled}>
            {strings.Run}
          </button>
        </div>
      </>
    );
  }
);
