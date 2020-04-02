import { Currency } from 'interfaces/currency';
import { Strategy } from 'interfaces/strategy';
import strings from 'locales';
import React, { ReactElement } from 'react';
import { Select } from 'components/Select';
import { $$ } from 'utils/stringPaster';
import { CCYGroups } from 'data/groups';

interface Props {
  symbols: Currency[];
  currency: string;
  products: Strategy[];
  strategy: string;
  runsDisabled: boolean;
  connected: boolean;
  onCurrencyChange: (value: string) => void;
  onStrategyChange: (value: string) => void;
  onClose?: () => void;
  onShowRunWindow: () => void;
}

export const Title: React.FC<Props> = (props: Props): ReactElement => {
  const { symbols, currency, products, strategy } = props;

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
        <Select value={currency} onChange={props.onCurrencyChange} list={symbols} empty={'Currency'} searchable={true}/>
      </div>
      <div className={'item'}>
        <Select value={strategy} onChange={props.onStrategyChange} list={products} empty={'Strategy'}/>
      </div>
      <div className={'ccy-group'}>
        {getGroup($$(currency, strategy))}
      </div>
      <button onClick={props.onShowRunWindow} disabled={props.runsDisabled}>
        {strings.Run}
      </button>
    </div>
  );
};
