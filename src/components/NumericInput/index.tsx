import { NavigateDirection } from "components/NumericInput/navigateDirection";
import workareaStore from "mobx/stores/workareaStore";
import React, { forwardRef, ReactElement, useState } from "react";

const randomName = (): string => {
  return Math.round(Number.MAX_SAFE_INTEGER * Math.random()).toString(16);
};

export enum TabDirection {
  Forward = 1,
  Backward = -1,
}

interface Props {
  readonly id?: string;
  readonly value: string;
  readonly type: "price" | "size";
  readonly onChange: (value: string | null) => void;
  readonly onDoubleClick?: (event: React.MouseEvent<HTMLInputElement>) => void;
  readonly readOnly?: boolean;
  readonly onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  readonly onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  readonly className?: string;
  readonly tabIndex?: number;
  readonly placeholder?: string;
  readonly title?: string;
  readonly onCancelEdit?: () => void;
  readonly onTabbedOut?: (
    target: HTMLInputElement,
    tabDirection: TabDirection
  ) => void;
  readonly onNavigate?: (
    target: HTMLInputElement,
    direction: NavigateDirection
  ) => void;
  readonly onSubmit?: (
    input: HTMLInputElement,
    tabDirection: TabDirection
  ) => void;
}

const NumericInput = forwardRef(
  <T extends any = string>(
    props: Props,
    ref: React.Ref<HTMLInputElement>
  ): ReactElement => {
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
    const [selectTimer, setSelectTimer] = useState(setTimeout(() => null, 0));

    const onFocusWrapper = (event: React.FocusEvent<HTMLInputElement>) => {
      const { target } = event;
      clearTimeout(selectTimer);
      setSelectTimer(setTimeout(() => target.select(), 30));
      if (typeof props.onFocus === "function") {
        props.onFocus(event);
      }
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
        readOnly={!workareaStore.connected || props.readOnly}
        name={randomName()}
        title={props.title}
        data-input-type={props.type}
        className={props.className}
        placeholder={props.placeholder}
        onKeyDown={onKeyPress}
        onChange={onChangeWrapper}
        onBlur={onBlurWrapper}
        onFocus={onFocusWrapper}
        ref={ref}
      />
    );
  }
);

export { NumericInput };
