import {Currency} from 'interfaces/currency';
import {Strategy} from 'interfaces/strategy';
import strings from 'locales';
import React, {ReactElement} from 'react';
import {Select} from 'components/Select';
import {$$} from 'utils/stringPaster';
import {CCYGroups} from 'data/groups';

interface Props {
  symbols: Currency[];
  symbol: string;
  products: Strategy[];
  strategy: string;
  runsDisabled: boolean;
  connected: boolean;
  setSymbol: (value: string) => void;
  setStrategy: (value: string) => void;
  onClose?: () => void;
  onShowRunWindow: () => void;
}

export const PodTileTitle: React.FC<Props> = (props: Props): ReactElement => {
  const {symbols, symbol, products, strategy, setSymbol, setStrategy} = props;

  const getGroup = (key: string): string => {
    if (CCYGroups[key] !== undefined) {
      return CCYGroups[key];
    } else {
      return '';
    }
  };

  return (
    <div className={'window-title-bar'}>
      <div className={'item'}>
        <Select value={symbol} onChange={setSymbol} list={symbols} empty={'Symbol'}/>
      </div>
      <div className={'item'}>
        <Select value={strategy} onChange={setStrategy} list={products} empty={'Strategy'}/>
      </div>
      <button onClick={props.onShowRunWindow} disabled={props.runsDisabled}>
        {strings.Run}
      </button>
      <div className={'ccy-group'}>
        {getGroup($$(symbol, strategy))}
      </div>
    </div>
  );
};
