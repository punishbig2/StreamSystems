import {getOrderStatusClass} from 'components/Table/CellRenderers/Price/utils/getOrderStatusClass';
import {Order, OrderStatus} from 'interfaces/order';
import React, {useEffect, useState, useCallback} from 'react';
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
  const [edited, setEdited] = useState<boolean>(false);
  const [value, setValue] = useState<string | null>(sizeFormatter(props.value));
  const {order, defaultValue, onChange, id, minSize} = props;

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

  const onChangeWrapper = (value: string | null) => {
    if (value === null) {
      setValue(sizeFormatter(order.quantity || defaultValue));
    } else {
      setEdited(true);
      setValue(value);
    }
  };

  const sendOnChange = useCallback((value: number | null) => {
    if (value === null) {
      onChange(id, value, true);
    } else {
      const numeric: number = Number(value);
      if (numeric < minSize) {
        onChange(id, minSize, true);
      } else {
        onChange(id, numeric, true);
      }
    }
  }, [onChange, id, minSize]);

  const onTabbedOut = (input: HTMLInputElement) => {
    sendOnChange(Number(value));
    if (props.onTabbedOut) {
      props.onTabbedOut(input);
    }
  };

  useEffect(() => {
    if (defaultValue === null || edited)
      return;
    sendOnChange(defaultValue);
    // eslint-disable-next-line
  }, [defaultValue, edited]);

  const getValueHelper = (forceEmpty: boolean) => {
    if (!edited && forceEmpty)
      return '';
    if (value !== null)
      return value;
    return sizeFormatter(props.value);
  };

  const reset = () => {
    setValue(null);
  };

  const getValue = () => {
    return getValueHelper((order.status & OrderStatus.Cancelled) !== 0
      && (order.status & OrderStatus.PriceEdited) === 0
      && (order.status & OrderStatus.QuantityEdited) === 0,
    );
  };

  return (
    <div className={'size-layout'}>
      <NumericInput
        tabIndex={-1}
        className={getOrderStatusClass(order.status, 'size')}
        placeholder={sizeFormatter(props.value)}
        type={'size'}
        value={getValue()}
        onChange={onChangeWrapper}
        onTabbedOut={onTabbedOut}
        onBlur={reset}
      />
    </div>
  );
};
