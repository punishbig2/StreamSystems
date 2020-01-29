import {getOrderStatusClass} from 'components/Table/CellRenderers/Price/utils/getOrderStatusClass';
import {Order, OrderStatus} from 'interfaces/order';
import React, {useEffect, useState, useCallback, ReactNode, useMemo} from 'react';
import {NumericInput} from 'components/NumericInput';
import {sizeFormatter} from 'utils/sizeFormatter';
import {OrderTypes} from 'interfaces/mdEntry';

interface Props {
  defaultValue: number;
  id: string;
  value: number | null;
  order: Order;
  minSize: number;
  onActivateOrder: (id: string, orderType: OrderTypes) => void;
  onTabbedOut?: (input: HTMLInputElement) => void;
  onChange: (id: string, value: number | null, changed: boolean) => void;
}

export const RunQuantity: React.FC<Props> = (props: Props) => {
  const [locallyModified, setLocallyModified] = useState<boolean>(false);
  const [value, setValue] = useState<string | null>(sizeFormatter(props.value));
  const {order, defaultValue, onChange, id, minSize} = props;

  const isModified: boolean = useMemo(() => {
    return (order.status & OrderStatus.QuantityEdited) !== 0;
  }, [order]);

  useEffect(() => {
    setLocallyModified(false);
    setValue(sizeFormatter(props.value));
  }, [props.value]);

  const onChangeWrapper = (value: string | null) => {
    if (!locallyModified)
      setLocallyModified(true);
    if (value === null) {
      setValue(sizeFormatter(order.quantity || defaultValue));
    } else {
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

  const onSubmitted = (input: HTMLInputElement) => {
    sendOnChange(Number(value));
    if (props.onTabbedOut) {
      props.onTabbedOut(input);
    }
  };

  useEffect(() => {
    if (value !== null || defaultValue === null || isModified)
      return;
    sendOnChange(defaultValue);
    // eslint-disable-next-line
  }, [defaultValue, isModified]);

  const getValueHelper = (forceEmpty: boolean) => {
    if (forceEmpty && !locallyModified)
      return '';
    if (value !== null)
      return value;
    return sizeFormatter(props.value);
  };

  const reset = () => {
    setValue(null);
  };

  const inactive: boolean = (order.status & OrderStatus.Cancelled) !== 0 && !isModified;

  const getValue = () => {
    return getValueHelper(inactive);
  };

  const onActivateOrder = () => {
    if (!inactive)
      return;
    props.onActivateOrder(props.id, order.type);
  };
  const plusSign = (
    <div className={'plus-sign' + (inactive ? ' active' : '')} onClick={onActivateOrder} key={1}>
      <i className={'fa fa-plus-circle'}/>
    </div>
  );

  const items: ReactNode[] = [
    <NumericInput
      key={0}
      tabIndex={-1}
      className={getOrderStatusClass(order.status, 'size')}
      placeholder={sizeFormatter(props.value)}
      type={'size'}
      value={getValue()}
      onChange={onChangeWrapper}
      onSubmitted={onSubmitted}
      onBlur={reset}/>,
  ];

  if (order.type === OrderTypes.Bid) {
    items.push(plusSign);
  } else {
    items.unshift(plusSign);
  }

  return (
    <div className={'size-layout'}>
      {items}
    </div>
  );
};
