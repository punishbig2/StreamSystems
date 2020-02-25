import {ColumnSpec} from 'components/Table/columnSpecification';
import {PodRowProps} from 'columns/podColumns/common';
import {Order, OrderStatus, DarkPoolOrder} from 'interfaces/order';
import {OrderTypes, MDEntry} from 'interfaces/mdEntry';
import {Price} from 'components/Table/CellRenderers/Price';
import {ArrowDirection, W} from 'interfaces/w';
import {PriceTypes} from 'components/Table/CellRenderers/Price/priceTypes';
import React, {useCallback, useEffect, useState, useMemo} from 'react';
import {DarkPoolTooltip} from 'components/Table/CellRenderers/Price/darkPoolTooltip';
import {PodTable} from 'interfaces/podTable';
import {PodRow} from 'interfaces/podRow';
import {STRM} from 'redux/stateDefs/workspaceState';
import {DarkPoolTicket} from 'components/DarkPoolTicket';
import {priceFormatter} from 'utils/priceFormatter';
import {ModalWindow} from 'components/ModalWindow';
import {getAuthenticatedUser} from 'utils/getCurrentUser';
import {User} from 'interfaces/user';
import {API} from 'API';
import {SignalRManager} from 'redux/signalR/signalRManager';
import {DarkPoolMessage} from 'interfaces/message';
import {FXOptionsDB} from 'fx-options-db';
import {$$} from 'utils/stringPaster';
import {onNavigate} from 'columns/podColumns/helpers';

type Props = PodRowProps;

const DarkPoolColumnComponent = (props: Props) => {
  const user: User = getAuthenticatedUser();
  const {tenor, symbol, strategy, personality, darkPrice} = props;
  const [orders, setOrders] = useState<Order[]>([]);
  const [isShowingTicket, setIsShowingTicket] = useState<boolean>(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const isBroker: boolean = user.isbroker;

  const [value, setValue] = useState<number | null>(darkPrice);

  useEffect(() => {
    const signalRManager: SignalRManager = SignalRManager.getInstance();
    const removePriceListener: () => void =
      signalRManager.addDarkPoolPxListener(symbol, strategy, tenor, (message: DarkPoolMessage) => {
        const value: number = Number(message.DarkPrice);
        // Update the saved dark pool
        FXOptionsDB.saveDarkPool($$(symbol, strategy, tenor), value);
        // Set the value in the input
        setValue(value);
      });

    const reset = () => {
      setValue(null);
      setCurrentOrder(null);
      setOrders([]);
    };

    const removeOrderListener: () => void =
      signalRManager.addDarkPoolOrderListener(symbol, strategy, tenor, (w: W) => {
        const entries: MDEntry[] = w.Entries;
        if (entries !== undefined) {
          const orders: Order[] = entries.map((entry: MDEntry) => Order.fromWAndMDEntry(w, entry, user));
          const currentOrder: Order | null = (() => {
            const myOrder: Order | undefined = orders.find((order: Order) => order.isOwnedByCurrentUser());
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
  }, [symbol, strategy, tenor, user, darkPrice]);

  // If the dark price changes update it
  useEffect(() => {
    setValue(darkPrice);
  }, [darkPrice]);

  /*useEffect(() => {
    if (!tenor || !symbol || !strategy) return;
    const update = (event: any) => {
      setData(event.detail);
    };
    const type: string = $$(tenor, symbol, strategy, 'update-dark-pool-depth');
    document.addEventListener(type, update);
    return () => {
      document.removeEventListener(type, update);
    };
  }, [tenor, symbol, strategy]);*/

  const onDoubleClick = useCallback(() => {
      if (isBroker && personality === STRM)
        return;
      setIsShowingTicket(true);
    }, [isBroker, personality],
  );

  const onSubmit = useCallback((input: HTMLInputElement, value: number | null) => {
      console.log(isBroker, value);
      if (!isBroker || value === null)
        return undefined;
      API.publishDarkPoolPrice(user.email, symbol, strategy, tenor, value);
    }, [isBroker, user.email, symbol, strategy, tenor],
  );

  /*const tabbedOutHandler = useCallback(
    (input: HTMLInputElement) => {
      if (input.readOnly)
        return;
      onTabbedOut(input, OrderTypes.DarkPool);
    },
    [onTabbedOut],
  );*/

  const myOrder: Order | undefined = useMemo(
    () => orders.find((order: Order) => order.user === user.email),
    [orders, user],
  );

  const cancelOrder = (order: Order) => {
    API.cancelDarkPoolOrder(order);
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
      if (currentOrder !== null && currentOrder.isOwnedByCurrentUser() === true)
        await API.cancelDarkPoolOrder(currentOrder);
      await API.createDarkPoolOrder(order);
      // actions.createDarkPoolOrder(order, personality);
      setIsShowingTicket(false);
    };
    const defaultSize: number = 0;
    return (
      <DarkPoolTicket
        onSubmit={onSubmit}
        onCancel={() => setIsShowingTicket(false)}
        price={priceFormatter(value)}
        size={defaultSize.toString()}
        tenor={tenor}
        strategy={strategy}
        symbol={symbol}
        user={user.email}/>
    );
  };
  const full: OrderStatus = orders.length > 0 ? OrderStatus.FullDarkPool : OrderStatus.None;
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
  weight: 5,
});
