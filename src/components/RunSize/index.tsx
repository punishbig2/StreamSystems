import { NumericInput, TabDirection } from "components/NumericInput";
import { NavigateDirection } from "components/NumericInput/navigateDirection";
import { getOrderStatusClass } from "components/Table/CellRenderers/Price/utils/getOrderStatusClass";
import { usePrevious } from "hooks/usePrevious";
import { observer } from "mobx-react";
import { RunSizeStore, RunSizeStoreContext } from "mobx/stores/runSizeStore";
import React, {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { OrderTypes } from "types/mdEntry";
import { Order, OrderStatus } from "types/order";
import { sizeFormatter } from "utils/sizeFormatter";
import { $$ } from "utils/stringPaster";

interface Props {
  readonly defaultValue: number;
  readonly id: string;
  readonly value: number | null;
  readonly order: Order;
  readonly minimumSize: number;
  readonly visible: boolean;
  readonly onActivateOrder: (id: string, orderType: OrderTypes) => void;
  readonly onDeactivateOrder: (id: string, orderType: OrderTypes) => void;
  readonly onTabbedOut?: (
    input: HTMLInputElement,
    tabDirection: TabDirection,
    action?: string
  ) => void;
  readonly onChange: (
    id: string,
    value: number | null,
    changed: boolean
  ) => void;
  readonly onNavigate: (
    input: HTMLInputElement,
    direction: NavigateDirection
  ) => void;
}

enum ActivationStatus {
  Active,
  Inactive,
  Empty,
}

export const RunSize: React.FC<Props> = observer((props: Props) => {
  const {
    order,
    defaultValue,
    onChange,
    id,
    minimumSize,
    visible,
    value,
  } = props;

  const store = useContext<RunSizeStore>(RunSizeStoreContext);

  const reset = useCallback(() => {
    if (!store.locallyModified) {
      store.setInternalValue(sizeFormatter(value), false);
    } else if (value === null) {
      store.setInternalValue(sizeFormatter(defaultValue), false);
    } else {
      store.setInternalValue(sizeFormatter(value), false);
    }
  }, [defaultValue, store, value]);

  useEffect(() => {
    store.setInternalValue(sizeFormatter(defaultValue), false);
  }, [store, defaultValue]);

  useEffect(() => {
    if (value !== null) {
      store.setInternalValue(sizeFormatter(value), false);
    } else {
      store.setInternalValue("", false);
    }
  }, [store, value, visible]);

  const onChangeWrapper = (value: string | null) => {
    if (value === null) {
      store.setInternalValue(sizeFormatter(order.size || defaultValue), true);
    } else {
      store.setInternalValue(value, true);
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
    if (store.locallyModified) {
      const numeric: number = Number(store.internalValue);
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
    if (defaultValue === null || store.locallyModified) return;
    if (!oldDefaultValue || oldDefaultValue === defaultValue) return;
    sendOnChange(defaultValue);
    // eslint-disable-next-line
  }, [defaultValue, oldDefaultValue, store.locallyModified]);

  const status: OrderStatus = order.status;

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

  const displayValue: string = useMemo((): string => {
    if (store.locallyModified) return store.internalValue;
    if (order.price === null) return "";
    if (
      (order.status & OrderStatus.Cancelled) !== 0 &&
      (order.status & OrderStatus.SizeEdited) === 0
    )
      return "";
    return store.internalValue;
  }, [store.internalValue, store.locallyModified, order.price, order.status]);

  const placeholder: string = (() => {
    if (order.price === null) return "";
    return store.internalValue;
  })();

  const onBlurEnsureMinimumSize = () => {
    if (Number(store.internalValue) >= minimumSize) return;
    store.setInternalValue(sizeFormatter(minimumSize), false);
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
});
