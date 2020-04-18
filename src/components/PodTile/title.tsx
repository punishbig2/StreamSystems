import { Currency } from 'interfaces/currency';
import strings from 'locales';
import React, { ReactElement } from 'react';
import { Select } from 'components/Select';
import { $$ } from 'utils/stringPaster';
import { CCYGroups } from 'data/groups';
import { PodTileStore } from 'mobx/stores/podTileStore';
import { observer } from 'mobx-react';
import { STRM } from 'stateDefs/workspaceState';
import workareaStore from 'mobx/stores/workareaStore';
import { User } from 'interfaces/user';

interface Props {
  store: PodTileStore;
  currencies: Currency[];
  strategies: string[];
}

export const PodTileTitle: React.FC<Props> = observer((props: Props): ReactElement => {
  const { store } = props;
  const { currency, strategy } = store;

  const personality: string = workareaStore.personality;

  const getGroup = (key: string): string => {
    if (CCYGroups[key] !== undefined) {
      return CCYGroups[key];
    } else {
      return '';
    }
  };

  const user: User = workareaStore.user;
  const isRunButtonDisabled: boolean = !currency || !strategy || (personality === STRM && user.isbroker);

  return (
    <>
      <div className={'item'}>
        <Select value={currency} onChange={store.setCurrency} list={props.currencies} empty={'Currency'}
                searchable={true}/>
      </div>
      <div className={'item'}>
        <Select value={strategy} onChange={store.setStrategy} list={props.strategies} empty={'Strategy'}/>
      </div>
      <div className={'ccy-group'}>
        {getGroup($$(currency, strategy))}
      </div>
      <button onClick={store.showRunWindow} disabled={isRunButtonDisabled}>
        {strings.Run}
      </button>
    </>
  );
});
