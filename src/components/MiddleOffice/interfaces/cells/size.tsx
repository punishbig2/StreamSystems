import React, { ReactElement } from 'react';
import { skipTabIndexAll } from 'utils/skipTab';
import { OrderTypes } from 'interfaces/mdEntry';
import { observer } from 'mobx-react';
import { CellProps } from 'components/MiddleOffice/DealBlotter/props';
import { Size } from 'components/Table/CellRenderers/Size';
import { sizeFormatter } from 'utils/sizeFormatter';

export const SizeCell: React.FC<CellProps> = observer(
  (props: CellProps): ReactElement => {
    const { store, deal } = props;
    const onSubmit = (input: HTMLInputElement, value: number | null) => {
      store.setSize(value);
      skipTabIndexAll(input, 1);
    };
    if (!deal) {
      return (
        <Size
          value={store.size}
          type={OrderTypes.Invalid}
          hideCancelButton={true}
          onSubmit={onSubmit}
        />
      );
    } else {
      return <div>{sizeFormatter(deal.lastQuantity)}</div>;
    }
  },
);
