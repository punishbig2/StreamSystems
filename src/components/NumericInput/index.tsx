import { NavigateDirection } from "components/NumericInput/navigateDirection";
import React, { ReactElement, useState } from "react";

export enum TabDirection {
  Forward = 1,
  Backward = -1,
}

interface Props {
  id?: string;
  value: string;
  type: "price" | "size";
  onChange: (value: string | null) => void;
  onDoubleClick?: (event: React.MouseEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
  tabIndex?: number;
  placeholder?: string;
  title?: string;
  onCancelEdit?: () => void;
  onTabbedOut?: (target: HTMLInputElement, tabDirection: TabDirection) => void;
  onNavigate?: (target: HTMLInputElement, direction: NavigateDirection) => void;
  onSubmit?: (input: HTMLInputElement, tabDirection: TabDirection) => void;
}

const NumericInput = <T extends any = string>(props: Props): ReactElement => {
  const {
    onTabbedOut,
    onNavigate,
    onSubmit,
    onChange,
    onCancelEdit,
    onBlur,
    className,
    ...otherProps
  } = props;
  const [selectTimer, setSelectTimer] = useState<number>(
    setTimeout(() => null, 0)
  );

  const onFocusWrapper = (event: React.FocusEvent<HTMLInputElement>) => {
    const { target } = event;
    clearTimeout(selectTimer);
    setSelectTimer(setTimeout(() => target.select(), 30));
  };

  const onBlurWrapper = (event: React.FocusEvent<HTMLInputElement>) => {
    clearTimeout(selectTimer);
    if (props.onBlur) {
      props.onBlur(event);
    }
  };

  const onKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const tabDirection: TabDirection = event.shiftKey
      ? TabDirection.Backward
      : TabDirection.Forward;
    const input: HTMLInputElement = event.currentTarget;
    switch (event.key) {
      case "Tab":
      case "Enter":
        event.preventDefault();
        onChange(input.value);
        if (onSubmit) {
          onSubmit(input, tabDirection);
        }
        if (onTabbedOut) {
          onTabbedOut(input, tabDirection);
        }
        break;
      case "ArrowUp":
        if (onNavigate) onNavigate(input, NavigateDirection.Up);
        if (onCancelEdit) onCancelEdit();
        event.preventDefault();
        break;
      case "ArrowLeft":
        if (onNavigate) onNavigate(input, NavigateDirection.Left);
        if (onCancelEdit) onCancelEdit();
        event.preventDefault();
        break;
      case "ArrowDown":
        if (onNavigate) onNavigate(input, NavigateDirection.Down);
        if (onCancelEdit) onCancelEdit();
        event.preventDefault();
        break;
      case "ArrowRight":
        if (onNavigate) onNavigate(input, NavigateDirection.Right);
        if (onCancelEdit) onCancelEdit();
        event.preventDefault();
        break;
      case "Escape":
        if (onCancelEdit) {
          onCancelEdit();
        }
        break;
    }
  };
  const onChangeWrapper = ({
    target: { value },
  }: React.ChangeEvent<HTMLInputElement>) => onChange(value);
  return (
    <input
      {...otherProps}
      id={props.id}
      title={props.title}
      data-input-type={props.type}
      className={props.className}
      placeholder={props.placeholder}
      onKeyDown={onKeyPress}
      onChange={onChangeWrapper}
      onBlur={onBlurWrapper}
      onFocus={onFocusWrapper}
    />
  );
};

export { NumericInput };
