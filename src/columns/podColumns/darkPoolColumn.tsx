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

type Props = PodRowProps;

/*enum Status {
  Publishing, Normal, Error
}*/

const DarkPoolColumnComponent: React.FC<Props> = observer((props: Props) => {
  /*const { tenor, currency, strategy, personality, darkPrice, connected, user } = props;
  const [orders, setOrders] = useState<Order[]>([]);
  const [isShowingTicket, setIsShowingTicket] = useState<boolean>(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<Status>(Status.Normal);
  const isBroker: boolean = user.isbroker;
  const [value, setValue] = useState<number | null>(darkPrice);

  useEffect(() => {
    const savedValue: string | null = localStorage.getItem($$(currency, strategy, tenor, 'DpPx'));
    if (savedValue === null)
      return;
    setValue(Number(savedValue));
  }, [tenor, strategy, currency]);

  useEffect(() => {
    const signalRManager: SignalRManager = SignalRManager.getInstance();
    const removePriceListener: () => void =
      signalRManager.addDarkPoolPxListener(currency, strategy, tenor, (message: DarkPoolMessage) => {
        const { DarkPrice } = message;
        const key: string = $$(currency, strategy, tenor, 'DpPx');
        if (DarkPrice === '') {
          localStorage.removeItem(key);
          // setValue(null);
        } else {
          const value: number = Number(message.DarkPrice);
          // Update the saved dark pool
          // FIXME: maybe we do need this?
          localStorage.setItem(key, value.toString());
          // Set the value in the input
          setValue(value);
        }
      });

    const reset = () => {
      // setValue(null);
      setCurrentOrder(null);
      setOrders([]);
    };

    const removeOrderListener: () => void =
      signalRManager.addDarkPoolOrderListener(currency, strategy, tenor, (w: W) => {
        const entries: MDEntry[] = w.Entries;
        if (entries !== undefined) {
          const orders: Order[] = entries.map((entry: MDEntry) => Order.fromWAndMDEntry(w, entry, user));
          const currentOrder: Order | null = (() => {
            const myOrder: Order | undefined = orders.find((order: Order) => order.user === user.email);
            const myBankOrder: Order | undefined = orders.find((order: Order) => order.firm === user.firm);
            if (myOrder !== undefined) {
              return myOrder;
            } else if (myBankOrder !== undefined) {
              return myBankOrder;
            } else if (orders.length > 0) {
              return orders[0];
            } else {
              return null;
            }
          })();
          console.log(currentOrder);
          setValue(currentOrder ? currentOrder.price : darkPrice);
          setCurrentOrder(currentOrder);
          setOrders(orders);
        } else {
          reset();
        }
      });
    reset();
    return () => {
      removePriceListener();
      removeOrderListener();
    };
  }, [currency, strategy, tenor, user, darkPrice, connected]);

  // If the dark price changes update it
  useEffect(() => {
    setValue(darkPrice);
  }, [darkPrice, value]);

  const onDoubleClick = useCallback(() => {
      if ((isBroker && personality === STRM) || value === null)
        return;
      setIsShowingTicket(true);
    }, [isBroker, personality, value],
  );

  const onSubmit = useCallback((input: HTMLInputElement, value: number | null) => {
      if (!isBroker)
        return undefined;
      // Now go to the next one
      skipTabIndexAll(input, 5, 2);
      if (value !== null) {
        setStatus(Status.Publishing);
        API.publishDarkPoolPrice(user.email, currency, strategy, tenor, value)
          .then(() => {
            setTimeout(() => {
              setStatus(Status.Normal);
              // Otherwise it's for some reason wiped!
              setValue(value);
            }, 0);
          })
          .catch(() => {
            setStatus(Status.Error);
          });
      } else {
        setStatus(Status.Publishing);
        API.cxlAllExtendedDarkPoolOrder({
          User: user.email,
          Strategy: strategy,
          Tenor: tenor,
          Symbol: currency,
        });
        API.publishDarkPoolPrice(user.email, currency, strategy, tenor, '')
          .then(() => {
            setTimeout(() => {
              setStatus(Status.Normal);
              // Otherwise it's for some reason wiped!
              setValue(value);
            }, 0);
          })
          .catch(() => {
            setStatus(Status.Error);
          });
      }
    }, [isBroker, user.email, currency, strategy, tenor],
  );

  const myOrder: Order | undefined = useMemo(
    () => orders.find((order: Order) => order.user === user.email),
    [orders, user],
  );

  const cancelOrder = (order: Order) => {
    API.cancelDarkPoolOrder(order, user);
  };

  const renderTooltip = (order: Order | undefined) => {
    if (order === undefined)
      return undefined;
    return () => {
      const table: PodTable = {
        [order.uid()]: {
          id: order.uid(),
          ofr: order.type === OrderTypes.Ofr ? order : undefined,
          bid: order.type === OrderTypes.Bid ? order : undefined,
        } as PodRow,
      };
      return (
        <DarkPoolTooltip onCancelOrder={cancelOrder} data={table}/>
      );
    };
  };

  const renderDarkPoolTicket = () => {
    if (!isShowingTicket)
      return <div/>;
    // const ticket: DarkPoolTicketData = state.darkPoolTicket;
    const onSubmit = async (order: DarkPoolOrder) => {
      if (currentOrder !== null && currentOrder.isOwnedByCurrentUser(user) === true)
        await API.cancelDarkPoolOrder(currentOrder, user);
      await API.createDarkPoolOrder(order, user);
      setIsShowingTicket(false);
    };
    const defaultSize: number = 0;
    if (value === null)
      throw new Error('dark pool price cannot be null at this point, something is very wrong');
    return (
      <DarkPoolTicket
        onSubmit={onSubmit}
        onCancel={() => setIsShowingTicket(false)}
        price={value}
        size={defaultSize}
        tenor={tenor}
        strategy={strategy}
        currency={currency}
        user={user.email}/>
    );
  };
  const full: OrderStatus = (orders.length > 0 ? OrderStatus.FullDarkPool : OrderStatus.None) | (
    status === Status.Publishing ? OrderStatus.Publishing : OrderStatus.None
  );
  console.log(value);*/
  const [store] = useState<DarkPoolStore>(new DarkPoolStore());
  const { currency, strategy, tenor, personality } = props;
  const user: User = workareaStore.user;

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
    if (user.isbroker && personality !== STRM)
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

