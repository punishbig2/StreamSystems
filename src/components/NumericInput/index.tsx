import {NavigateDirection} from 'components/NumericInput/navigateDirection';
import React, {ReactElement} from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onDoubleClick?: (event: React.MouseEvent) => void;
  onReturnPressed?: () => void;
  readOnly?: boolean;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
  tabIndex?: number;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onTabbedOut?: (target: HTMLInputElement) => void;
  onNavigate?: (target: HTMLInputElement, direction: NavigateDirection) => void;
}

const NumericInput = <T extends any = string>(props: Props): ReactElement => {
  const {onReturnPressed, onTabbedOut, ...otherProps} = props;
  const onKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'Enter':
        if (onReturnPressed) {
          event.preventDefault();
          onReturnPressed();
        }
        break;
      case 'Tab':
        if (onTabbedOut && !event.shiftKey) {
          event.preventDefault();
          onTabbedOut(event.target as HTMLInputElement);
        }
        break;
      case 'ArrowUp':
        if (props.onNavigate)
          props.onNavigate(event.target as HTMLInputElement, NavigateDirection.Up);
        break;
      case 'ArrowLeft':
        if (props.onNavigate)
          props.onNavigate(event.target as HTMLInputElement, NavigateDirection.Left);
        break;
      case 'ArrowDown':
        if (props.onNavigate)
          props.onNavigate(event.target as HTMLInputElement, NavigateDirection.Down);
        break;
      case 'ArrowRight':
        if (props.onNavigate)
          props.onNavigate(event.target as HTMLInputElement, NavigateDirection.Right);
        break;
    }
  };
  const onChange = ({target: {value}}: React.ChangeEvent<HTMLInputElement>) => props.onChange(value);
  return (
    <input {...otherProps} onKeyDown={onKeyPress} onChange={onChange}/>
  );
};

export {NumericInput};

