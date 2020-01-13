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

type Props = RowType & TOBColumnData;

const DarkPoolColumnComponent = (props: Props) => {
  const {darkPool, darkPrice} = props;
  const {onDarkPoolDoubleClicked, onDarkPoolPriceChanged, onTabbedOut} = props;
  const {isBroker, tenor, symbol, strategy} = props;
  const [data, setData] = useState<TOBTable | null>(null);

  const order: Order | null = useMemo((): Order | null => {
    if (!darkPool)
      return null;
    const {bid, ofr} = darkPool;
    if (bid.price === null)
      return ofr;
    return bid;
  }, [darkPool]);

  const price: number | null = useMemo(() => order ? order.price : darkPrice, [order, darkPrice]);
  useEffect(() => {
    if (!tenor || !symbol || !strategy)
      return;
    const update = (event: any) => {
      setData(event.detail);
    };
    const type: string = $$(tenor, symbol, strategy, 'update-dark-pool-depth');
    document.addEventListener(type, update);
    return () => {
      document.removeEventListener(type, update);
    };
  }, [tenor, symbol, strategy]);

  const doubleClickHandler = useCallback(() => {
    if (isBroker)
      return;
    onDarkPoolDoubleClicked(tenor, price);
  }, [isBroker, price, tenor, onDarkPoolDoubleClicked]);

  const changeHandler = useCallback((value: number | null) => {
    if (!isBroker || value === null)
      return undefined;
    onDarkPoolPriceChanged(tenor, Number(value));
  }, [isBroker, tenor, onDarkPoolPriceChanged]);

  const tabbedOutHandler = useCallback((input: HTMLInputElement) => {
    if (input.readOnly)
      return;
    onTabbedOut(input, OrderTypes.DarkPool);
  }, [onTabbedOut]);

  return (
    <Price
      arrow={ArrowDirection.None}
      priceType={PriceTypes.DarkPool}
      onDoubleClick={doubleClickHandler}
      onChange={changeHandler}
      onTabbedOut={tabbedOutHandler}
      value={price}
      tooltip={() => <DarkPoolTooltip data={data}/>}
      readOnly={!props.isBroker}
      status={order !== null ? order.status : OrderStatus.None}/>
  );
};

export const DarkPoolColumn = (data: TOBColumnData): ColumnSpec => ({
  name: 'dark-pool',
  header: () => (
    <div className={'dark-pool-header'}>
      <div>Dark</div>
      <div>Pool</div>
    </div>
  ),
  render: (row: RowType) => <DarkPoolColumnComponent {...data} {...row}/>,
  template: '999999.99',
  weight: 5,
});
