import {NavigateDirection} from 'components/NumericInput/navigateDirection';
import React, {ReactElement} from 'react';

interface Props {
  value: string;
  type: 'price' | 'size',
  onChange: (value: string | null) => void;
  onDoubleClick?: (event: React.MouseEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
  tabIndex?: number;
  onCancelEdit?: () => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onTabbedOut?: (target: HTMLInputElement) => void;
  onNavigate?: (target: HTMLInputElement, direction: NavigateDirection) => void;
  onSubmitted?: (input: HTMLInputElement) => void;
}

const NumericInput = <T extends any = string>(props: Props): ReactElement => {
  const {
    onTabbedOut,
    onNavigate,
    onSubmitted,
    onFocus,
    onChange,
    onCancelEdit,
    ...otherProps
  } = props;

  const onKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const input: HTMLInputElement = event.currentTarget;
    switch (event.key) {
      case "Tab":
      case "Enter":
        if (onTabbedOut) {
          event.preventDefault();
          if (event.shiftKey) return;
          onChange(input.value);
          if (onSubmitted) onSubmitted(input);
          onTabbedOut(input);
        }
        break;
      case "ArrowUp":
        if (onNavigate) onNavigate(input, NavigateDirection.Up);
        if (onCancelEdit)
          onCancelEdit();
        event.preventDefault();
        break;
      case "ArrowLeft":
        if (onNavigate) onNavigate(input, NavigateDirection.Left);
        if (onCancelEdit)
          onCancelEdit();
        event.preventDefault();
        break;
      case "ArrowDown":
        if (onNavigate) onNavigate(input, NavigateDirection.Down);
        if (onCancelEdit)
          onCancelEdit();
        event.preventDefault();
        break;
      case "ArrowRight":
        if (onNavigate) onNavigate(input, NavigateDirection.Right);
        if (onCancelEdit)
          onCancelEdit();
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
    target: { value }
  }: React.ChangeEvent<HTMLInputElement>) => onChange(value);
  return (
    <input
      {...otherProps}
      data-input-type={props.type}
      onKeyDown={onKeyPress}
      onChange={onChangeWrapper}
      onFocus={onFocus}
    />
  );
};

export { NumericInput };
