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
  const {onReturnPressed, onTabbedOut, onNavigate, ...otherProps} = props;
  const onKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    console.log(event.key);
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
        if (onNavigate)
          onNavigate(event.target as HTMLInputElement, NavigateDirection.Up);
        event.preventDefault();
        break;
      case 'ArrowLeft':
        if (onNavigate)
          onNavigate(event.target as HTMLInputElement, NavigateDirection.Left);
        event.preventDefault();
        break;
      case 'ArrowDown':
        if (onNavigate)
          onNavigate(event.target as HTMLInputElement, NavigateDirection.Down);
        event.preventDefault();
        break;
      case 'ArrowRight':
        if (onNavigate)
          onNavigate(event.target as HTMLInputElement, NavigateDirection.Right);
        event.preventDefault();
        break;
    }
  };
  const onChange = ({target: {value}}: React.ChangeEvent<HTMLInputElement>) => props.onChange(value);
  return (
    <input {...otherProps} onKeyDown={onKeyPress} onChange={onChange}/>
  );
};

export {NumericInput};

