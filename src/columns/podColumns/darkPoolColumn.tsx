import {ColumnSpec} from 'components/Table/columnSpecification';
import {RowProps} from 'columns/podColumns/common';
import {Order, OrderStatus, DarkPoolOrder} from 'interfaces/order';
import {OrderTypes} from 'interfaces/mdEntry';
import {Price} from 'components/Table/CellRenderers/Price';
import {ArrowDirection} from 'interfaces/w';
import {PriceTypes} from 'components/Table/CellRenderers/Price/priceTypes';
import React, {useCallback, useMemo, useEffect, useState} from 'react';
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

type Props = RowProps;

const DarkPoolColumnComponent = (props: Props) => {
  const user: User = getAuthenticatedUser();
  const {tenor, symbol, strategy, personality, darkPool, darkPrice} = props;
  const [data, setData] = useState<PodTable | null>(null);
  const [isShowingTicket, setIsShowingTicket] = useState<boolean>(false);
  const isBroker: boolean = user.isbroker;

  const order: Order | null = useMemo((): Order | null => {
    if (!darkPool) return null;
    const {bid, ofr} = darkPool;
    if (bid.price === null) return ofr;
    return bid;
  }, [darkPool]);

  const [value, setValue] = useState<number | null>(order ? order.price : darkPrice);

  useEffect(() => {
    const signalRManager: SignalRManager = SignalRManager.getInstance();
    return signalRManager.addDarkPoolPxListener(symbol, strategy, tenor, (message: DarkPoolMessage) => {
      const value: number = Number(message.DarkPrice);
      // Update the saved dark pool
      FXOptionsDB.saveDarkPool($$(symbol, strategy, tenor), value);
      // Set the value in the input
      setValue(value);
    });
  }, [symbol, strategy, tenor]);

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

  const findMyOrder = (table: any): Order | null => {
    if (!table) return null;
    const values: PodRow[] = Object.values(table);
    const row: PodRow | undefined = values.find(
      ({ofr, bid}: PodRow): boolean => {
        if ((ofr.status & OrderStatus.Owned) !== 0) return true;
        return (bid.status & OrderStatus.Owned) !== 0;
      },
    );
    if (row === undefined) return null;
    const {ofr, bid} = row;
    if ((ofr.status & OrderStatus.Owned) !== 0) return ofr;
    return bid;
  };

  const myOrder: Order | null = findMyOrder(data);
  const finalOrder: Order | null = myOrder ? myOrder : order;
  const renderTooltip = (order: Order | null) => {
    if (order === null) return undefined;
    return () => {
      const table: PodTable = {
        [order.uid()]: {
          id: order.uid(),
          ofr: order.type === OrderTypes.Ofr ? order : undefined,
          bid: order.type === OrderTypes.Bid ? order : undefined,
        } as PodRow,
      };
      return (
        <DarkPoolTooltip
          onCancelOrder={props.onCancelDarkPoolOrder}
          data={table}
        />
      );
    };
  };
  const renderDarkPoolTicket = () => {
    if (!isShowingTicket)
      return <div/>;
    // const ticket: DarkPoolTicketData = state.darkPoolTicket;
    const onSubmit = (order: DarkPoolOrder) => {
      /*if (ticket.currentOrder !== null) {
        const order: Order = ticket.currentOrder;
        if ((order.status & OrderStatus.Owned) !== 0) {
          // actions.cancelDarkPoolOrder(ticket.currentOrder);
        }
      }*/
      // actions.createDarkPoolOrder(order, personality);
      setIsShowingTicket(false);
    };
    const defaultSize: number = 0;
    return (
      <DarkPoolTicket
        onSubmit={onSubmit}
        onCancel={() => setIsShowingTicket(false)}
        price={priceFormatter(0)}
        size={defaultSize.toString()}
        tenor={tenor}
        strategy={strategy}
        symbol={symbol}
        user={user.email}/>
    );
  };
  const showDarkpoolTicket = () => {

  };
  const rows: PodRow[] = data ? Object.values(data) : [];
  const full: OrderStatus = rows.length > 0 ? OrderStatus.FullDarkPool : OrderStatus.None;
  return (
    <>
      <Price
        arrow={ArrowDirection.None}
        priceType={PriceTypes.DarkPool}
        className={'dark-pool-base'}
        value={value}
        tooltip={renderTooltip(myOrder)}
        readOnly={props.personality !== STRM && isBroker}
        status={finalOrder !== null ? finalOrder.status | OrderStatus.DarkPool | full : OrderStatus.None}
        onDoubleClick={showDarkpoolTicket}
        onSubmit={onSubmit}
        onNavigate={() => null}/>
      <ModalWindow
        render={renderDarkPoolTicket}
        visible={isShowingTicket}/>
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
  render: (row: RowProps) => <DarkPoolColumnComponent {...row} />,
  template: '999999.99',
  weight: 5,
});
