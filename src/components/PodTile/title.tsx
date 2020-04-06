import { Currency } from 'interfaces/currency';
import strings from 'locales';
import React, { ReactElement } from 'react';
import { Select } from 'components/Select';
import { $$ } from 'utils/stringPaster';
import { CCYGroups } from 'data/groups';
import { PodTileStore } from 'mobx/stores/podTile';
import { observer } from 'mobx-react';

interface Props {
  store: PodTileStore;
  currencies: Currency[];
  strategies: string[];
}

export const PodTileTitle: React.FC<Props> = observer((props: Props): ReactElement => {
  const { store } = props;
  const { currency, strategy } = store;

  const getGroup = (key: string): string => {
    if (CCYGroups[key] !== undefined) {
      return CCYGroups[key];
    } else {
      return '';
    }
  };

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
      <button onClick={store.showRunWindow} disabled={store.isRunButtonEnabled}>
        {strings.Run}
      </button>
    </>
  );
});
