import {Quantity} from 'components/Table/CellRenderers/Quantity';
import {Order, OrderStatus} from 'interfaces/order';
import {SettingsContext} from 'main';
import React, {useContext, useEffect, useState} from 'react';
import {Settings} from 'settings';

const sizeFormatter = (value: number | null): string => {
  if (value === null)
    return '';
  return value.toFixed(0);
};

interface Props {
  onChange: (id: string, value: number | null) => void;
  defaultValue: number;
  id: string;
  value: number | null;
  order: Order;
  onCancel: (order: Order) => void;
}

export const RunQuantity: React.FC<Props> = (props: Props) => {
  const [value, setValue] = useState<string | null>(sizeFormatter(props.value));
  const settings = useContext<Settings>(SettingsContext);
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
    if (value === null) {
      setValue(sizeFormatter(order.quantity || props.defaultValue));
    } else {
      setValue(value);
    }
  };
  const sendOnChange = () => {
    if (value === null) {
      props.onChange(props.id, value);
    } else {
      const numeric: number = Number(value);
      if (numeric < settings.minSize) {
        props.onChange(props.id, settings.minSize);
      } else {
        props.onChange(props.id, numeric);
      }
    }
  };
  const cancellable: boolean = (order.status & OrderStatus.Owned) !== 0;
  return (
    <>
      <Quantity type={order.type}
                value={Number(value)}
                onChange={onChange}
                onBlur={sendOnChange}
                onCancel={() => props.onCancel(order)}
                cancelable={cancellable}
                tabIndex={-1}/>
    </>
  );
};

