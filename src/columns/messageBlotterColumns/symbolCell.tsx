import React, { ReactElement, useState } from 'react';
import { Message } from '../../interfaces/message';
import workareaStore from '../../mobx/stores/workareaStore';
import { Currency } from '../../interfaces/currency';
import { Select } from '../../components/Select';
import { compareCurrencies } from './utils';

export const SymbolCell: React.FC<{ message: Message }> = ({ message }: { message: Message }): ReactElement => {
  const { currencies } = workareaStore;
  const [value, setValue] = useState<string>('');
  if (message) {
    return <div>{message.Symbol}</div>;
  } else {
    const list: any[] = currencies
      .map((currency: Currency): string => currency.name)
      .sort(compareCurrencies)
      .map((name: string) => {
        return {
          name: name, value: name,
        };
      });
    return (
      <Select fit={true} list={list} value={value} onChange={setValue}/>
    );
  }
};
