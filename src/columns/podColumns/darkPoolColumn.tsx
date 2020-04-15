import { ColumnSpec } from 'components/Table/columnSpecification';
import { PodRowProps } from 'columns/podColumns/common';
import { Order, OrderStatus, DarkPoolOrder } from 'interfaces/order';
import { OrderTypes, MDEntry } from 'interfaces/mdEntry';
import { Price } from 'components/Table/CellRenderers/Price';
import { ArrowDirection, W } from 'interfaces/w';
import { PriceTypes } from 'components/Table/CellRenderers/Price/priceTypes';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { DarkPoolTooltip } from 'components/Table/CellRenderers/Price/darkPoolTooltip';
import { PodTable } from 'interfaces/podTable';
import { PodRow } from 'interfaces/podRow';
import { STRM } from 'stateDefs/workspaceState';
import { DarkPoolTicket } from 'components/DarkPoolTicket';
import { ModalWindow } from 'components/ModalWindow';
import { API } from 'API';
import { SignalRManager } from 'signalR/signalRManager';
import { DarkPoolMessage } from 'interfaces/message';
import { onNavigate } from 'components/PodTile/helpers';
import { $$ } from 'utils/stringPaster';
import { skipTabIndexAll } from 'utils/skipTab';

type Props = PodRowProps;

enum Status {
  Publishing, Normal, Error
}

const DarkPoolColumnComponent = (props: Props) => {
  const { tenor, currency, strategy, personality, darkPrice, connected, user } = props;
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
    setTimeout(() => {
      setValue(Number(savedValue));
    }, 0);
  }, [tenor, strategy, currency]);

  useEffect(() => {
    const signalRManager: SignalRManager = SignalRManager.getInstance();
    const removePriceListener: () => void =
      signalRManager.addDarkPoolPxListener(currency, strategy, tenor, (message: DarkPoolMessage) => {
        const { DarkPrice } = message;
        const key: string = $$(currency, strategy, tenor, 'DpPx');
        if (DarkPrice === '') {
          localStorage.removeItem(key);
          setValue(null);
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
      setValue(null);
      setCurrentOrder(null);
      setOrders([]);
    };

    const removeOrderListener: () => void =
      signalRManager.addDarkPoolOrderListener(currency, strategy, tenor, (w: W) => {
        const entries: MDEntry[] = w.Entries;
        if (entries !== undefined) {
          const orders: Order[] = entries.map((entry: MDEntry) => Order.fromWAndMDEntry(w, entry, user));
          const currentOrder: Order | null = (() => {
            const myOrder: Order | undefined = orders.find((order: Order) => order.isOwnedByCurrentUser(user));
            const myBankOrder: Order | undefined = orders.find((order: Order) => order.isSameBankAsCurrentUser());
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
  }, [darkPrice]);

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
  return (
    <>
      <Price
        arrow={ArrowDirection.None}
        priceType={PriceTypes.DarkPool}
        className={'dark-pool-base'}
        value={value}
        tooltip={renderTooltip(myOrder)}
        readOnly={(props.personality !== STRM && isBroker) || !isBroker}
        status={(currentOrder !== null ? currentOrder.status : OrderStatus.None) | OrderStatus.DarkPool | full}
        allowZero={true}
        onDoubleClick={onDoubleClick}
        onSubmit={onSubmit}
        onNavigate={onNavigate}/>
      <ModalWindow render={renderDarkPoolTicket} visible={isShowingTicket}/>
    </>
  );
};

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

