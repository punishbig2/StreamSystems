import { NumericInput } from "components/NumericInput";
import { Chevron } from "components/Table/CellRenderers/Price/chevron";
import { OrderTypes } from "interfaces/mdEntry";
import React, { ReactNode, useState, useEffect } from "react";
import { sizeFormatter } from "utils/sizeFormatter";
import { NavigateDirection } from "components/NumericInput/navigateDirection";
import { xPoints } from "timesPolygon";

interface OwnProps {
  type: OrderTypes;
  value: number | null;
  // onChange: (value: string | null) => void;
  cancellable?: boolean;
  onCancel?: () => void;
  className?: string;
  hideCancelButton?: boolean;
  chevron?: boolean;
  tabIndex?: number;
  readOnly?: boolean;
  onSubmit: (target: HTMLInputElement, value: number | null) => void;
  onNavigate?: (input: HTMLInputElement, direction: NavigateDirection) => void;
}

const defaultProps: OwnProps = {
  onCancel: () => null,
  onSubmit: () => null,
  hideCancelButton: false,
  type: OrderTypes.Invalid,
  value: null,
  cancellable: false,
  chevron: false,
};

export const Size: React.FC<OwnProps> = (props: OwnProps = defaultProps) => {
  const { value } = props;
  const [internalValue, setInternalValue] = useState<number | null>(value);
  const classes: string[] = ["times"];

  // If value prop changes, change our internal representation too
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const onChange = (value: string | null) => {
    if (value === null) {
      setInternalValue(value);
    } else {
      const numeric: number = Number(value);
      if (isNaN(numeric)) {
        setInternalValue(null);
      } else {
        setInternalValue(numeric);
      }
    }
  };

  const onSubmit = (input: HTMLInputElement) => {
    props.onSubmit(input, internalValue);
  };

  const onBlur = () => {
    setInternalValue(value);
  };

  const children: ReactNode[] = [
    <NumericInput
      key={1}
      value={sizeFormatter(internalValue)}
      type={"size"}
      className={props.className}
      tabIndex={props.tabIndex}
      readOnly={props.readOnly}
      onNavigate={props.onNavigate}
      onBlur={onBlur}
      onChange={onChange}
      onSubmit={onSubmit}
    />,
  ];

  if (props.cancellable) classes.push("clickable");
  if (props.value === null || props.hideCancelButton) classes.push("empty");
  const button = (
    <div key={2} className={classes.join(" ")} onClick={props.onCancel}>
      <svg viewBox={"0 0 612 792"}>
        <g>
          <polygon className={"st0"} points={xPoints} />
        </g>
      </svg>
    </div>
  );
  if (props.type === OrderTypes.Bid) {
    if (props.chevron) children.push(<Chevron side={"left"} key={3} />);
    children.push(button);
  } else {
    children.unshift(button);
    if (props.chevron) children.push(<Chevron side={"right"} key={3} />);
  }
  const layoutClasses: string[] = ["size-layout", "cell"];
  if (!!props.className) layoutClasses.push(props.className);
  return <div className={layoutClasses.join(" ")}>{children}</div>;
};
