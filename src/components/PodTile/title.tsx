import {Currency} from 'interfaces/currency';
import {Strategy} from 'interfaces/strategy';
import strings from 'locales';
import React, {ReactElement} from 'react';
import {Select} from 'components/Select';

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
    </div>
  );
};
