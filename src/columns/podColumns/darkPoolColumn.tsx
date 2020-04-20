import { ColumnSpec } from 'components/Table/columnSpecification';
import { PodRowProps } from 'columns/podColumns/common';
import { Price } from 'components/Table/CellRenderers/Price';
import { ArrowDirection } from 'interfaces/w';
import { PriceTypes } from 'components/Table/CellRenderers/Price/priceTypes';
import React, { useState, useEffect, ReactElement } from 'react';
import { STRM } from 'stateDefs/workspaceState';
import { ModalWindow } from 'components/ModalWindow';
import { onNavigate } from 'components/PodTile/helpers';
import { DarkPoolStore } from 'mobx/stores/darkPoolStore';
import workareaStore from 'mobx/stores/workareaStore';
import { User } from 'interfaces/user';
import { skipTabIndexAll } from 'utils/skipTab';
import { observer } from 'mobx-react';
import { DarkPoolTicket } from 'components/DarkPoolTicket';
import { Order, DarkPoolOrder } from 'interfaces/order';
import { DarkPoolTooltip } from 'components/Table/CellRenderers/Price/darkPoolTooltip';
import { PodTable } from 'interfaces/podTable';
import { PodRow } from 'interfaces/podRow';

type Props = PodRowProps;

const DarkPoolColumnComponent: React.FC<Props> = observer((props: Props) => {
  const [store] = useState<DarkPoolStore>(new DarkPoolStore());
  const { currency, strategy, tenor, darkpool } = props;
  const user: User = workareaStore.user;
  const personality: string = workareaStore.personality;

  useEffect(() => {
    if (!darkpool)
      return;
    store.onOrderReceived(darkpool);
  }, [store, darkpool, user]);

  const onTicketSubmitted = (order: DarkPoolOrder) => {
    store.createOrder(order);
  };

  const renderTicket = (): ReactElement | null => {
    const order: Order | null = store.currentOrder;
    if (store.price === null)
      return null;
    return (
      <DarkPoolTicket
        onSubmit={onTicketSubmitted}
        onCancel={() => store.closeTicket()}
        price={store.price}
        size={order ? order.size : null}
        tenor={tenor}
        strategy={strategy}
        currency={currency}/>
    );
  };

  const renderTooltip = () => {
    const depth: PodTable | null = store.depth;
    if (depth === null)
      return null;
    const values: PodRow[] = Object.values(depth);
    if (values.length === 0)
      return null;
    return (
      <DarkPoolTooltip onCancelOrder={store.cancel} data={depth}/>
    );
  };

  useEffect(() => {
    store.connect(currency, strategy, tenor);
    return () => {
      DarkPoolStore.disconnect(currency, strategy, tenor);
    };
  }, [currency, store, strategy, tenor]);

  const onSubmit = (input: HTMLInputElement, price: number | null, changed: boolean) => {
    if (!changed)
      return;
    // Publish the price through Signal R
    store.publishPrice(currency, strategy, tenor, price);
    // Move to the next dark pool price
    skipTabIndexAll(input, 5, 2);
  };

  const onDoubleClick = () => {
    if (user.isbroker && personality === STRM)
      return;
    store.openTicket();
  };

  if (user === null)
    throw new Error('cannot show a dark pool column if there is no authenticated user');
  return (
    <>
      <Price
        arrow={ArrowDirection.None}
        priceType={PriceTypes.DarkPool}
        className={'dark-pool-base'}
        value={store.price}
        tooltip={renderTooltip}
        readOnly={(personality !== STRM && user.isbroker) || !user.isbroker}
        status={store.status}
        allowZero={true}
        onDoubleClick={onDoubleClick}
        onSubmit={onSubmit}
        onNavigate={onNavigate}/>
      <ModalWindow render={renderTicket} visible={store.isTicketOpen}/>
    </>
  );
});

export const DarkPoolColumn = (): ColumnSpec => ({
  name: 'dark-pool',
  header: () => (
    <div className={'dark-pool-header'}>
      <div>Dark</div>
      <div>Pool</div>
    </div>
  ),
  render: (row: PodRowProps) => <DarkPoolColumnComponent {...row} />,
  template: '999999.99',
  width: 5,
});

