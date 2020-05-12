import React, { ReactElement, useState } from 'react';
import { Message } from '../../interfaces/message';
import workareaStore from '../../mobx/stores/workareaStore';
import { Strategy } from '../../interfaces/strategy';
import { Select } from '../../components/Select';

export const StrategyCell: React.FC<{ message: Message }> = ({ message }: { message: Message }): ReactElement => {
  const { strategies } = workareaStore;
  const [value, setValue] = useState<string>('');
  if (message) {
    return <div>{message.Strategy}</div>;
  } else {
    const list: any[] = strategies
      .map(({ name }: Strategy) => {
        return {
          name: name, value: name,
        };
      });
    return (
      <Select fit={true} list={list} value={value} onChange={setValue}/>
    );
  }
};
