import {getOrderStatusClass} from 'components/Table/CellRenderers/Price/utils/getOrderStatusClass';
import {Quantity} from 'components/Table/CellRenderers/Quantity';
import {Order, OrderStatus} from 'interfaces/order';
import React, {useState, useEffect} from 'react';
import {NavigateDirection} from 'components/NumericInput/navigateDirection';
import {$$} from 'utils/stringPaster';
import {OrderTypes} from 'interfaces/mdEntry';

interface Props {
  order: Order;
  isDepth: boolean;
  onCancel: (order: Order, cancelRelated: boolean) => void;
  onSubmit: (
    order: Order,
    newQuantity: number | null,
    personality: string,
    minimumSize: number,
    input: HTMLInputElement,
  ) => void;
  value: number | null;
  minimumSize: number;
  defaultSize: number;
  personality: string;
  onNavigate: (input: HTMLInputElement, direction: NavigateDirection) => void;
}

export const PodSize: React.FC<Props> = (props: Props) => {
  const {order} = props;
  const [value, setValue] = useState<number | null>(props.value);

  useEffect(() => {
    setValue(props.value);
  }, [props.value]);

  useEffect(() => {
    if (order.type === OrderTypes.Bid) {
      const type: string = $$(order.uid(), order.type, 'CLEAR_SIZE');
      const clearSize = () => {
        setValue(null);
      };
      document.addEventListener(type, clearSize);
      return () => {
        document.removeEventListener(type, clearSize);
      };
    }
  }, [order]);

  const onSubmit = (input: HTMLInputElement) => {
    if (value === 0) {
      props.onSubmit(order, null, props.personality, props.minimumSize, input);
    } else if (value !== null && value < props.minimumSize) {
      props.onSubmit(order, props.minimumSize, props.personality, props.minimumSize, input);
    } else {
      props.onSubmit(order, value, props.personality, props.minimumSize, input);
    }
  };

  const onChange = (value: string | null) => {
    if (value === null) {
      if ((order.status & OrderStatus.PreFilled) !== 0) {
        setValue(order.size);
      } else {
        setValue(null);
      }
    } else {
      const numeric: number = Number(value);
      if (isNaN(numeric))
        return;
      setValue(numeric);
    }
  };

  const canCancel = (order: Order) => {
    if (order.price === null || order.size === null)
      return false;
    if (order.isCancelled())
      return false;
    return order.isOwnedByCurrentUser();
  };

  const cancellable = canCancel(order);
  const onCancel = () => (cancellable ? props.onCancel(order, true) : null);
  const showChevron = !props.isDepth
    && (order.status & OrderStatus.HasDepth) !== 0
    && order.price !== null;

  const onBlur = () => {
    if (order.price === null) {
      setValue(null);
    } else {
      setValue(order.size);
    }
  };

  return (
    <Quantity
      value={value}
      type={order.type}
      tabIndex={-1}
      cancellable={cancellable}
      className={getOrderStatusClass(order.status, 'size cell')}
      chevron={showChevron}
      onNavigate={props.onNavigate}
      onBlur={onBlur}
      onChange={onChange}
      onCancel={onCancel}
      onSubmit={onSubmit}/>
  );
};

