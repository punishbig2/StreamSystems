import { getOrderStatusClass } from "components/Table/CellRenderers/Price/utils/getOrderStatusClass";
import { Order, OrderStatus } from "types/order";
import React, { useEffect, useState, useCallback, ReactNode } from "react";
import { NumericInput, TabDirection } from "components/NumericInput";
import { sizeFormatter } from "utils/sizeFormatter";
import { OrderTypes } from "types/mdEntry";
import { usePrevious } from "hooks/usePrevious";
import { NavigateDirection } from "components/NumericInput/navigateDirection";
import { $$ } from "utils/stringPaster";

interface Props {
  defaultValue: number;
  id: string;
  value: number | null;
  order: Order;
  minimumSize: number;
  visible: boolean;
  onActivateOrder: (id: string, orderType: OrderTypes) => void;
  onDeactivateOrder: (id: string, orderType: OrderTypes) => void;
  onTabbedOut?: (
    input: HTMLInputElement,
    tabDirection: TabDirection,
    action?: string
  ) => void;
  onChange: (id: string, value: number | null, changed: boolean) => void;
  onNavigate: (input: HTMLInputElement, direction: NavigateDirection) => void;
}

enum ActivationStatus {
  Active,
  Inactive,
  Empty,
}

export const RunSize: React.FC<Props> = (props: Props) => {
  const [locallyModified, setLocallyModified] = useState<boolean>(false);
  const {
    order,
    defaultValue,
    onChange,
    id,
    minimumSize,
    visible,
    value,
  } = props;
  const [internalValue, setInternalValue] = useState<string>(
    sizeFormatter(value)
  );

  useEffect(() => {
    if (value === null) return;
    setLocallyModified(false);
    setInternalValue(sizeFormatter(value));
  }, [value]);

  useEffect(() => {
    setLocallyModified(false);
    setInternalValue(sizeFormatter(defaultValue));
  }, [defaultValue]);

  useEffect(() => {
    setLocallyModified(false);
    if (value !== null) {
      setInternalValue(sizeFormatter(value));
    }
  }, [value, visible]);

  const onChangeWrapper = (value: string | null) => {
    if (!locallyModified) setLocallyModified(true);
    if (value === null) {
      setInternalValue(sizeFormatter(order.size || defaultValue));
    } else if (value.length === 0) {
      reset();
    } else {
      setInternalValue(value);
    }
  };

  const sendOnChange = useCallback(
    (value: number | null) => {
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
    },
    [onChange, id, minimumSize]
  );

  const tabOut = (input: HTMLInputElement, tabDirection: TabDirection) => {
    if (props.onTabbedOut) {
      props.onTabbedOut(input, tabDirection, $$(order.type, "size"));
    }
  };

  const onSubmit = (input: HTMLInputElement, tabDirection: TabDirection) => {
    if (locallyModified) {
      const numeric: number = Number(internalValue);
      if (!isNaN(numeric)) {
        if (numeric < props.minimumSize) {
          input.focus();
        } else {
          sendOnChange(numeric);
          tabOut(input, tabDirection);
        }
      }
    } else {
      tabOut(input, tabDirection);
    }
  };

  const oldDefaultValue: number | undefined = usePrevious<number>(defaultValue);
  useEffect(() => {
    if (defaultValue === null || locallyModified) return;
    if (!oldDefaultValue || oldDefaultValue === defaultValue) return;
    sendOnChange(defaultValue);
    // eslint-disable-next-line
  }, [defaultValue, oldDefaultValue, locallyModified]);

  const status: OrderStatus = order.status;
  const reset = () => {
    if (!locallyModified) {
      setInternalValue(internalValue);
    } else if (value === null) {
      setInternalValue(sizeFormatter(defaultValue));
    } else {
      setInternalValue(sizeFormatter(value));
    }
    setLocallyModified(false);
  };

  const getActivationStatus = (): ActivationStatus => {
    if (order.price === null) return ActivationStatus.Empty;
    if (
      (order.status & OrderStatus.PriceEdited) === 0 &&
      (order.status & OrderStatus.Active) === 0
    ) {
      return ActivationStatus.Inactive;
    } else if ((order.status & OrderStatus.PriceEdited) !== 0) {
      return ActivationStatus.Active;
    } else {
      return ActivationStatus.Empty;
    }
  };

  const onActivateOrder = () => {
    const status: ActivationStatus = getActivationStatus();
    if (status === ActivationStatus.Active) {
      props.onDeactivateOrder(props.id, order.type);
    } else if (status === ActivationStatus.Inactive) {
      props.onActivateOrder(props.id, order.type);
    }
  };

  const getActivationButton = () => {
    switch (getActivationStatus()) {
      case ActivationStatus.Inactive:
        return (
          <div
            key={"3"}
            className={"plus-sign inactive"}
            onClick={onActivateOrder}
          >
            <i className={"fa fa-plus-circle"} />
          </div>
        );
      case ActivationStatus.Active:
        return (
          <div
            key={"3"}
            className={"plus-sign active"}
            onClick={onActivateOrder}
          >
            <i className={"fa fa-minus-circle"} />
          </div>
        );
      case ActivationStatus.Empty:
        return (
          <div key={"3"} className={"plus-sign empty"}>
            <i className={"far fa-circle"} />
          </div>
        );
      default:
        return null;
    }
  };

  const plusSign = getActivationButton();

  const displayValue: string = (() => {
    if (locallyModified) return internalValue;
    if (order.price === null) return "";
    if (
      (order.status & OrderStatus.Cancelled) !== 0 &&
      (order.status & OrderStatus.SizeEdited) === 0
    )
      return "";
    return internalValue;
  })();

  const placeholder: string = (() => {
    if (order.price === null) return "";
    return internalValue;
  })();

  const onBlurEnsureMinimumSize = () => {
    if (Number(internalValue) >= minimumSize) return;
    setInternalValue(sizeFormatter(minimumSize));
  };

  const items: ReactNode[] = [
    <NumericInput
      id={$$("run-size-", order.uid(), order.type)}
      key={0}
      tabIndex={-1}
      className={getOrderStatusClass(status, "size")}
      placeholder={placeholder}
      type={"size"}
      value={displayValue}
      onNavigate={props.onNavigate}
      onBlur={onBlurEnsureMinimumSize}
      onChange={onChangeWrapper}
      onSubmit={onSubmit}
      onCancelEdit={reset}
    />,
  ];

  if (order.type === OrderTypes.Bid) {
    items.push(plusSign);
  } else {
    items.unshift(plusSign);
  }

  return <div className={"size-layout"}>{items}</div>;
};
