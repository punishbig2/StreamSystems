import {getOrderStatusClass} from 'components/Table/CellRenderers/Price/utils/getOrderStatusClass';
import {Order, OrderStatus, dumpStatus} from 'interfaces/order';
import React, {useEffect, useState, useCallback, ReactNode} from 'react';
import {NumericInput} from 'components/NumericInput';
import {sizeFormatter} from 'utils/sizeFormatter';
import {OrderTypes} from 'interfaces/mdEntry';
import {usePrevious} from 'hooks/usePrevious';
import {NavigateDirection} from 'components/NumericInput/navigateDirection';
import {$$} from 'utils/stringPaster';

interface Props {
  defaultValue: number;
  id: string;
  value: number | null;
  order: Order;
  minimumSize: number;
  onActivateOrder: (id: string, orderType: OrderTypes) => void;
  onTabbedOut?: (input: HTMLInputElement, action?: string) => void;
  onChange: (id: string, value: number | null, changed: boolean) => void;
  onNavigate: (input: HTMLInputElement, direction: NavigateDirection) => void;
}

export const RunSize: React.FC<Props> = (props: Props) => {
  const [locallyModified, setLocallyModified] = useState<boolean>(false);
  const [internalValue, setInternalValue] = useState<string>(sizeFormatter(props.value));
  const {order, defaultValue, onChange, id, minimumSize} = props;

  useEffect(() => {
    if (props.value === null)
      return;
    setLocallyModified(false);
    setInternalValue(sizeFormatter(props.value));
  }, [props.value]);

  useEffect(() => {
    setLocallyModified(false);
    setInternalValue(sizeFormatter(defaultValue));
  }, [defaultValue]);

  const onChangeWrapper = (value: string | null) => {
    if (!locallyModified)
      setLocallyModified(true);
    if (value === null) {
      setInternalValue(sizeFormatter(order.size || defaultValue));
    } else {
      setInternalValue(value);
    }
  };

  const sendOnChange = useCallback((value: number | null) => {
    if (value === null) {
      onChange(id, value, true);
    } else {
      const numeric: number = Number(value);
      if (numeric < minimumSize) {
        onChange(id, minimumSize, true);
      } else {
        onChange(id, numeric, true);
      }
    }
  }, [onChange, id, minimumSize]);

  const onSubmit = (input: HTMLInputElement) => {
    sendOnChange(Number(internalValue));
    if (props.onTabbedOut) {
      props.onTabbedOut(input, $$(order.type, 'size'));
    }
  };

  const oldDefaultValue: number | undefined = usePrevious<number>(defaultValue);
  useEffect(() => {
    if (defaultValue === null || locallyModified)
      return;
    if (!oldDefaultValue || oldDefaultValue === defaultValue)
      return;
    sendOnChange(defaultValue);
    // eslint-disable-next-line
  }, [defaultValue, oldDefaultValue, locallyModified]);

  const reset = () => {
    if (props.value === null) {
      setInternalValue(sizeFormatter(defaultValue));
    } else {
      setInternalValue(sizeFormatter(props.value));
    }
    setLocallyModified(false);
  };

  const inactive: boolean = ((order.status & OrderStatus.Cancelled) !== 0
    && (order.status & OrderStatus.SizeEdited) === 0
    && !locallyModified
  );

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

  const displayValue: string = (() => {
    if (order.price === null)
      return '';
    if ((order.status & OrderStatus.Cancelled) !== 0 && (order.status & OrderStatus.SizeEdited) === 0)
      return '';
    return internalValue;
  })();

  const placeholder: string = (() => {
    if (order.price === null)
      return '';
    return internalValue;
  })();

  const items: ReactNode[] = [
    <NumericInput
      id={$$('run-size-', order.uid(), order.type)}
      key={0}
      tabIndex={-1}
      className={getOrderStatusClass(order.status, 'size')}
      placeholder={placeholder}
      type={'size'}
      value={displayValue}
      onNavigate={props.onNavigate}
      onChange={onChangeWrapper}
      onSubmit={onSubmit}
      onCancelEdit={reset}/>,
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
