import {TOBColumnData} from 'components/TOB/data';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {RowType} from 'columns/tobColumns/common';
import {Order, OrderStatus} from 'interfaces/order';
import {OrderTypes} from 'interfaces/mdEntry';
import {Price} from 'components/Table/CellRenderers/Price';
import {ArrowDirection} from 'interfaces/w';
import {PriceTypes} from 'components/Table/CellRenderers/Price/priceTypes';
import React, {useCallback, useMemo, useEffect, useState} from 'react';
import {DarkPoolTooltip} from 'components/Table/CellRenderers/Price/darkPoolTooltip';
import {$$} from 'utils/stringPaster';
import {TOBTable} from 'interfaces/tobTable';
import {TOBRow} from 'interfaces/tobRow';
import {STRM} from 'redux/stateDefs/workspaceState';

type Props = RowType & TOBColumnData;

const DarkPoolColumnComponent = (props: Props) => {
  const {
    isBroker,
    tenor,
    symbol,
    strategy,
    personality,
    darkPool,
    darkPrice
  } = props;
  const {
    onDarkPoolDoubleClicked,
    onDarkPoolPriceChanged,
    onTabbedOut
  } = props;
  const [data, setData] = useState<TOBTable | null>(null);

  const order: Order | null = useMemo((): Order | null => {
    if (!darkPool) return null;
    const { bid, ofr } = darkPool;
    if (bid.price === null) return ofr;
    return bid;
  }, [darkPool]);

  const price: number | null = useMemo(
    () => {
      if (order)
        return order.price;
      return darkPrice;
    },
    [order, darkPrice]
  );
  useEffect(() => {
    if (!tenor || !symbol || !strategy) return;
    const update = (event: any) => {
      setData(event.detail);
    };
    const type: string = $$(tenor, symbol, strategy, "update-dark-pool-depth");
    document.addEventListener(type, update);
    return () => {
      document.removeEventListener(type, update);
    };
  }, [tenor, symbol, strategy]);

  const doubleClickHandler = useCallback(
    (currentOrder: Order | null) => {
      if (isBroker && personality === STRM) return;
      onDarkPoolDoubleClicked(tenor, price, currentOrder);
    },
    [isBroker, personality, onDarkPoolDoubleClicked, tenor, price]
  );

  const changeHandler = useCallback(
    (value: number | null) => {
      if (!isBroker || value === null) return undefined;
      onDarkPoolPriceChanged(tenor, Number(value));
    },
    [isBroker, tenor, onDarkPoolPriceChanged]
  );

  const tabbedOutHandler = useCallback(
    (input: HTMLInputElement) => {
      if (input.readOnly) return;
      onTabbedOut(input, OrderTypes.DarkPool);
    },
    [onTabbedOut]
  );

  const findMyOrder = (table: any): Order | null => {
    if (!table) return null;
    const values: TOBRow[] = Object.values(table);
    const row: TOBRow | undefined = values.find(
      ({ ofr, bid }: TOBRow): boolean => {
        if ((ofr.status & OrderStatus.Owned) !== 0) return true;
        return (bid.status & OrderStatus.Owned) !== 0;
      }
    );
    if (row === undefined) return null;
    const { ofr, bid } = row;
    if ((ofr.status & OrderStatus.Owned) !== 0) return ofr;
    return bid;
  };

  const myOrder: Order | null = findMyOrder(data);
  const finalOrder: Order | null = myOrder ? myOrder : order;
  const renderTooltip = (order: Order | null) => {
    if (order === null) return undefined;
    return () => {
      const table: TOBTable = {
        [order.uid()]: {
          id: order.uid(),
          ofr: order.type === OrderTypes.Ofr ? order : undefined,
          bid: order.type === OrderTypes.Bid ? order : undefined
        } as TOBRow
      };
      return (
        <DarkPoolTooltip
          onCancelOrder={props.onCancelDarkPoolOrder}
          data={table}
        />
      );
    };
  };
  const rows: TOBRow[] = data ? Object.values(data) : [];
  const full: OrderStatus =
    rows.length > 0 ? OrderStatus.FullDarkPool : OrderStatus.None;
  return (
    <Price
      arrow={ArrowDirection.None}
      priceType={PriceTypes.DarkPool}
      className={"dark-pool-base"}
      value={price}
      tooltip={renderTooltip(myOrder)}
      readOnly={!props.isBroker}
      status={
        finalOrder !== null
          ? finalOrder.status | OrderStatus.DarkPool | full
          : OrderStatus.None
      }
      onDoubleClick={() => doubleClickHandler(order)}
      onChange={changeHandler}
      onTabbedOut={tabbedOutHandler}
      onNavigate={props.onNavigate}
    />
  );
};

export const DarkPoolColumn = (data: TOBColumnData): ColumnSpec => ({
  name: "dark-pool",
  header: () => (
    <div className={"dark-pool-header"}>
      <div>Dark</div>
      <div>Pool</div>
    </div>
  ),
  render: (row: RowType) => <DarkPoolColumnComponent {...data} {...row} />,
  template: "999999.99",
  weight: 5
});
