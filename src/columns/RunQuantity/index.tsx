import {Quantity} from 'components/Table/CellRenderers/Quantity';
import {Order, OrderStatus} from 'interfaces/order';
import React, {useEffect, useState} from 'react';

const sizeFormatter = (value: number | null): string => {
  if (value === null)
    return '';
  return value.toFixed(0);
};

interface Props {
  onChange: (id: string, value: number) => void;
  defaultValue: number;
  id: string;
  value: number | null;
  order: Order;
}

export const RunQuantity: React.FC<Props> = (props: Props) => {
  const [value, setValue] = useState<string>(sizeFormatter(props.value));
  const {order} = props;
  useEffect(() => {
    if (props.defaultValue === undefined || props.defaultValue === null)
      return;
    if ((order.status & OrderStatus.PreFilled) !== 0)
      return;
    setValue(sizeFormatter(props.defaultValue));
  }, [order.status, props.defaultValue]);
  useEffect(() => {
    if (props.value === null)
      return;
    setValue(sizeFormatter(props.value));
  }, [props.value]);
  const onChange = (value: string | null) => {
    if (value === null)
      return;
    props.onChange(props.id, Number(value));
  };
  const cancellable: boolean = (order.status & OrderStatus.Owned) !== 0;
  return (
    <React.Fragment>
      <Quantity type={order.type} value={Number(value)} onChange={onChange} cancelable={cancellable}/>
    </React.Fragment>
  );
};

