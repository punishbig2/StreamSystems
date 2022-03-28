import { NumericInput, TabDirection } from "components/NumericInput";
import { NavigateDirection } from "components/NumericInput/navigateDirection";
import { Direction } from "components/Table/CellRenderers/Price/direction";
import { PriceTypes } from "components/Table/CellRenderers/Price/priceTypes";
import { getOrderStatusClass } from "components/Table/CellRenderers/Price/utils/getOrderStatusClass";
import { OrderTypes } from "types/mdEntry";
import { ArrowDirection } from "types/w";
import React from "react";
import { priceFormatter } from "utils/priceFormatter";
import { Tooltip } from "components/Table/CellRenderers/Price/tooltip";
import { OrderStatus } from "types/order";
import { CircularSpinner } from "components/circularSpinner";
import { observer } from "mobx-react";
import { PriceStore } from "mobx/stores/priceStore";

export enum PriceErrors {
  GreaterThanMax,
  LessThanMin,
}

export interface Props {
  readonly value: number | null;
  readonly type?: OrderTypes;
  readonly priceType?: PriceTypes;
  readonly tabIndex?: number;
  readonly arrow: ArrowDirection;
  readonly status: OrderStatus;
  readonly title?: string;
  readonly className?: string;
  readonly min?: number | null;
  readonly max?: number | null;
  readonly allowZero?: boolean;
  readonly animated?: boolean;
  readonly readOnly?: boolean;
  readonly uid?: string;
  readonly timestamp?: string;
  readonly tooltip?: React.FC<any> | string;
  readonly onTabbedOut?: (
    input: HTMLInputElement,
    tabDirection: TabDirection
  ) => void;
  readonly onNavigate?: (
    target: HTMLInputElement,
    direction: NavigateDirection
  ) => void;
  readonly onError?: (error: PriceErrors, input: HTMLInputElement) => void;
  readonly onDoubleClick?: () => void;
  readonly onSubmit: (
    input: HTMLInputElement,
    value: number | null,
    changed: boolean,
    tabDirection: TabDirection
  ) => void;
}

export const Price: React.FC<Props> = observer((props: Props) => {
  const [store] = React.useState<PriceStore>(new PriceStore());
  const [input, setInput] = React.useState<HTMLInputElement | null>(null);
  const { value, status, tooltip } = props;
  if (value === undefined) throw new Error("value is not optional");

  React.useEffect(() => {
    store.setBaseValue(value);
    setEdited(false);
  }, [input, store, value]);

  React.useEffect(() => {
    store.setStatus(status);
    setEdited(false);
  }, [store, status]);

  const [target, setTarget] = React.useState<HTMLDivElement | null>(null);
  const [edited, setEdited] = React.useState<boolean>(false);

  const showTooltip = tooltip
    ? (): void => {
        store.showTooltip();
      }
    : undefined;

  const hideTooltip = (): void => {
    store.hideTooltip();
  };

  const getTooltip = (): React.ReactElement | null => {
    if (!tooltip || !store.tooltipVisible) return null;
    const content: React.ReactElement | string | null =
      typeof tooltip === "function" ? tooltip({}) : tooltip;
    if (!content) return null;
    return (
      <Tooltip target={target} onClose={hideTooltip}>
        {content}
      </Tooltip>
    );
  };

  const onChange = (value: string | null) => {
    if (!edited) {
      setEdited(true);
    }
    if (value !== null) {
      const trimmed: string = value.trim();
      const numeric: number = Number(trimmed + "0");
      if (!isNaN(numeric)) {
        store.setInternalValue(trimmed);
      }
    } else {
      store.setInternalValue(value);
    }
  };

  const isOpenOrderTicketStatus = (status: OrderStatus): boolean => {
    if ((status & OrderStatus.DarkPool) !== 0) return true;
    return (
      (status & OrderStatus.Owned) === 0 &&
      (status & OrderStatus.SameBank) === 0
    );
  };

  const onDoubleClick = (event: React.MouseEvent<HTMLInputElement>) => {
    // Stop the event
    event.stopPropagation();
    event.preventDefault();
    if (props.onDoubleClick && isOpenOrderTicketStatus(props.status)) {
      const target: HTMLInputElement = event.currentTarget;
      // Remove focus and selection
      target.setSelectionRange(0, 0);
      target.blur();
      // Call the callback
      return props.onDoubleClick();
    }
  };

  const isModified = (): boolean => {
    return edited;
  };

  const onSubmit = (input: HTMLInputElement, tabDirection: TabDirection) => {
    if (!input.readOnly) {
      const { numericValue } = store;

      const scaledValue = Math.round(1000 * (numericValue ?? 0));
      if (scaledValue % 25 !== 0) {
        store.setInputError("Invalid price increment");
        return;
      } else {
        store.setInputError(null);
      }

      const changed: boolean = isModified();
      if (numericValue === 0 && !props.allowZero) {
        props.onSubmit(input, null, false, tabDirection);
      } else {
        props.onSubmit(input, numericValue, changed, tabDirection);
      }
      setTimeout(() => store.setInternalValue(null), 0);
    } else {
      props.onSubmit(input, null, false, tabDirection);
    }
    setEdited(false);
  };

  const onFocus = (): void => {
    store.setInternalValue(store.value);
  };

  const onCancelEdit = () => {
    store.setInternalValue(null);
    store.setInputError(null);
    setEdited(false);
  };

  const getPlaceholder = (value: number | null) => {
    return priceFormatter(value);
  };

  const getErrorTooltip = (): React.ReactElement | null => {
    if (store.inputError === null) {
      return null;
    }
    return <div className={"input-error"}>{store.inputError}</div>;
  };

  const getSpinner = () => {
    if ((props.status & OrderStatus.BeingCreated) !== 0) {
      return (
        <div className={"spinner"}>
          <CircularSpinner />
          <span>Creating&hellip;</span>
        </div>
      );
    } else if ((props.status & OrderStatus.BeingCancelled) !== 0) {
      return (
        <div className={"spinner"}>
          <CircularSpinner />
          <span>Cancelling&hellip;</span>
        </div>
      );
    } else if ((props.status & OrderStatus.BeingLoaded) !== 0) {
      return (
        <div className={"spinner"}>
          <CircularSpinner />
          <span>Loading&hellip;</span>
        </div>
      );
    } else if ((props.status & OrderStatus.Publishing) !== 0) {
      return (
        <div className={"spinner"}>
          <CircularSpinner />
          <span>Pub&hellip;</span>
        </div>
      );
    }
  };
  const classes = ["price-layout", "cell"];
  if (props.className) classes.push(props.className);
  if (store.flashing) classes.push("flash");
  classes.push(getOrderStatusClass(props.status));
  return (
    <>
      <div
        className={classes.join(" ")}
        onMouseLeave={hideTooltip}
        onMouseEnter={showTooltip}
        ref={setTarget}
      >
        {value !== null && props.arrow !== ArrowDirection.None && (
          <Direction direction={props.arrow} />
        )}
        <NumericInput
          id={props.uid}
          ref={setInput}
          readOnly={props.readOnly}
          tabIndex={props.tabIndex}
          title={props.title}
          value={store.value}
          className={store.internalValue !== null ? "modified" : "initial"}
          placeholder={getPlaceholder(props.value)}
          type={"price"}
          onCancelEdit={onCancelEdit}
          onFocus={onFocus}
          onBlur={onCancelEdit}
          onDoubleClick={onDoubleClick}
          onChange={onChange}
          onSubmit={onSubmit}
          onTabbedOut={props.onTabbedOut}
          onNavigate={props.onNavigate}
        />
        {/* The floating object */}
        {getTooltip()}
        {getSpinner()}
        {getErrorTooltip()}
      </div>
    </>
  );
});

Price.defaultProps = {
  animated: true,
  readOnly: false,
};
