import { useGlow } from 'components/PodTile/hooks/useGlow';
import { Select } from 'components/Select';
import strings from 'locales';
import { PodStore, PodStoreContext } from 'mobx/stores/podStore';
import workareaStore from 'mobx/stores/workareaStore';
import { observer } from 'mobx-react';
import React, { ReactElement, useMemo } from 'react';
import { NONE } from 'stateDefs/workspaceState';
import { FXSymbol } from 'types/FXSymbol';
import { Product } from 'types/product';
import { hasRole, Role } from 'types/role';
import { User } from 'types/user';

interface Props {
  readonly currencies: readonly FXSymbol[];
  readonly strategies: readonly Product[];
}

export const PodTileTitle: React.FC<Props> = observer((props: Props): ReactElement => {
  const store = React.useContext<PodStore>(PodStoreContext);
  const { ccyPair, strategy } = store;

  const personality: string = workareaStore.personality;

  const user: User = workareaStore.user;
  const isBroker: boolean = useMemo((): boolean => {
    const { roles } = user;
    return hasRole(roles, Role.Broker);
  }, [user]);
  const isRunButtonDisabled: boolean = !ccyPair || !strategy || (personality === NONE && isBroker);
  const { currencies, strategies } = props;

  const glowing: boolean = useGlow(store.orders, store.darkOrders);

  return (
    <>
      <div className={['glow', ...(glowing ? ['glowing'] : [])].join(' ')} />
      <div className="item">
        <Select
          testId="currency-selector"
          value={ccyPair}
          list={currencies.map((item: FXSymbol): { name: string } => ({
            name: item.name,
          }))}
          empty="Currency"
          disabled={!workareaStore.connected}
          searchable={true}
          onChange={store.setCurrency}
        />
      </div>
      <div className="item">
        <Select
          testId="strategy-selector"
          value={strategy}
          list={strategies.map(
            (
              item: Product
            ): {
              name: string;
            } => ({
              name: item.name,
            })
          )}
          disabled={!workareaStore.connected}
          empty="Strategy"
          onChange={store.setStrategy}
        />
      </div>
      {/* <div className="ccy-group">{getTag(currency, strategy)}</div> */}
      <div className="item">
        <button onClick={store.showRunWindow} disabled={isRunButtonDisabled}>
          {strings.Run}
        </button>
      </div>
    </>
  );
});
