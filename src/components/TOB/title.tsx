import {MenuItem, Select} from '@material-ui/core';
import {Currency} from 'interfaces/currency';
import {Strategy} from 'interfaces/strategy';
import React, {ReactElement} from 'react';
import strings from 'locales';

interface Props {
  symbols: Currency[];
  symbol: string,
  products: Strategy[];
  onClose?: () => void;
  strategy: string;
  setSymbol: (event: React.ChangeEvent<{ name?: string, value: unknown }>, child: React.ReactNode) => void;
  setProduct: (event: React.ChangeEvent<{ name?: string, value: unknown }>, child: React.ReactNode) => void;
}

export const TOBTileTitle: React.FC<Props> = (props: Props): ReactElement => {
  const {symbols, symbol, products, strategy, setSymbol, setProduct} = props;
  const renderValue = (placeholder: string) => (value: unknown): React.ReactNode => {
    if (!value)
      return placeholder;
    return value as string;
  };
  return (
    <div className={'window-title-bar'}>
      <Select value={symbol} className={'select'} autoWidth={true} onChange={setSymbol}
              renderValue={renderValue(strings.Currency)}
              displayEmpty={true}>
        {symbols.map((item: Currency) => (
          <MenuItem key={item.name} value={item.name}>{item.name}</MenuItem>
        ))}
      </Select>
      <Select value={strategy} className={'select'} autoWidth={true} onChange={setProduct}
              renderValue={renderValue(strings.Strategy)}
              displayEmpty={true}>
        {products.map((item: Strategy) => (
          <MenuItem key={item.name} value={item.name}>{item.name}</MenuItem>
        ))}
      </Select>
    </div>
  );
};
