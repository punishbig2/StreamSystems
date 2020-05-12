import React, { ReactElement, useState } from 'react';
import { Message } from '../../interfaces/message';
import workareaStore from '../../mobx/stores/workareaStore';
import { Select } from '../../components/Select';

export const BankCell: React.FC<{ message: Message }> = ({ message }: { message: Message }): ReactElement | null => {
  const { banks } = workareaStore;
  const [value, setValue] = useState<string>('');
  if (message) {
    return null;
  } else {
    const list: any[] = banks
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
