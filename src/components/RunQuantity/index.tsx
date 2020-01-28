import {getOrderStatusClass} from 'components/Table/CellRenderers/Price/utils/getOrderStatusClass';
import {Order, OrderStatus} from 'interfaces/order';
import React, {useEffect, useState} from 'react';
import {NumericInput} from 'components/NumericInput';
import {sizeFormatter} from 'utils/sizeFormatter';

interface Props {
  defaultValue: number;
  id: string;
  value: number | null;
  order: Order;
  onTabbedOut?: (input: HTMLInputElement) => void;
  onChange: (id: string, value: number | null, changed: boolean) => void;
  onCancel: (order: Order) => void;
  minSize: number;
}

export const RunQuantity: React.FC<Props> = (props: Props) => {
  const [value, setValue] = useState<string | null>(sizeFormatter(props.value));
  const {order} = props;

  useEffect(() => {
    if ((order.status & OrderStatus.QuantityEdited) !== 0) return;
    if (props.defaultValue === undefined || props.defaultValue === null) return;
    if (
      (order.status & OrderStatus.PreFilled) !== 0 &&
      (order.status & OrderStatus.Cancelled) === 0
    )
      return;
    setValue(sizeFormatter(props.defaultValue));
  }, [order.status, props.defaultValue]);

  useEffect(() => {
    if (props.value === null)
      return;
    setValue(sizeFormatter(props.value));
  }, [props.value]);

  useEffect(() => {
    if (props.defaultValue === null)
      return;
    setValue(sizeFormatter(props.defaultValue));
  }, [props.defaultValue]);

  const onChange = (value: string | null) => {
    if (value === null) {
      setValue(sizeFormatter(order.quantity || props.defaultValue));
    } else {
      setValue(value);
    }
  };

  const sendOnChange = (input: HTMLInputElement) => {
    if (value === null) {
      props.onChange(props.id, value, true);
    } else {
      const numeric: number = Number(value);
      if (numeric < props.minSize) {
        props.onChange(props.id, props.minSize, true);
      } else {
        props.onChange(props.id, numeric, true);
      }
    }
    if (props.onTabbedOut) {
      props.onTabbedOut(input);
    }
  };

  const getValueHelper = (forceEmpty: boolean) => {
    if ((order.status & OrderStatus.QuantityEdited) === 0 && forceEmpty)
      return '';
    if (value !== null)
      return value;
    return sizeFormatter(props.value);
  };

  const getValue = () => {
    return getValueHelper((order.status & OrderStatus.Cancelled) !== 0);
  };

  return (
    <div className={'size-layout'}>
      <NumericInput
        tabIndex={-1}
        className={getOrderStatusClass(order.status, 'size')}
        onChange={onChange}
        onTabbedOut={sendOnChange}
        placeholder={sizeFormatter(props.value)}
        type={'size'}
        value={getValue()}/>
    </div>
  );
};
