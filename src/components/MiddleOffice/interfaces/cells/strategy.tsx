import React, { ReactElement } from 'react';
import { Strategy } from 'interfaces/strategy';
import { observer } from 'mobx-react';
import { CellProps } from 'components/MiddleOffice/DealBlotter/props';
import workareaStore from 'mobx/stores/workareaStore';
import { Select } from 'components/Select';

export const StrategyCell: React.FC<CellProps> = observer(
  (props: CellProps): ReactElement => {
    const { store, deal } = props;
    const { strategies } = workareaStore;
    if (deal) {
      return <div>{deal.strategy}</div>;
    } else {
      const list: any[] = strategies.map(({ name }: Strategy) => {
        return {
          name: name,
          value: name,
        };
      });
      return (
        <Select
          fit={true}
          list={list}
          value={store.strategy}
          empty={'Strategy'}
          onChange={store.setStrategy}
        />
      );
    }
  },
);
