import {NavigateDirection} from 'components/NumericInput/navigateDirection';
import React, {ReactElement} from 'react';

interface Props {
  value: string;
  onChange: (value: string | null) => void;
  onDoubleClick?: (event: React.MouseEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
  tabIndex?: number;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onTabbedOut?: (target: HTMLInputElement) => void;
  onNavigate?: (target: HTMLInputElement, direction: NavigateDirection) => void;
}

const NumericInput = <T extends any = string>(props: Props): ReactElement => {
  const {onTabbedOut, onNavigate, onFocus, ...otherProps} = props;
  const onKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const input: HTMLInputElement = event.currentTarget;
    switch (event.key) {
      case 'Tab':
      case 'Enter':
        if (onTabbedOut) {
          event.preventDefault();
          if (event.shiftKey)
            return;
          // Tabbed out event
          onTabbedOut(input);
        }
        break;
      case 'ArrowUp':
        if (onNavigate)
          onNavigate(input, NavigateDirection.Up);
        event.preventDefault();
        break;
      case 'ArrowLeft':
        if (onNavigate)
          onNavigate(input, NavigateDirection.Left);
        event.preventDefault();
        break;
      case 'ArrowDown':
        if (onNavigate)
          onNavigate(input, NavigateDirection.Down);
        event.preventDefault();
        break;
      case 'ArrowRight':
        if (onNavigate)
          onNavigate(input, NavigateDirection.Right);
        event.preventDefault();
        break;
      case 'Escape':
        props.onChange(null);
        break;
    }
  };
  const onChange = ({target: {value}}: React.ChangeEvent<HTMLInputElement>) => props.onChange(value);
  return (
    <input {...otherProps} onKeyDown={onKeyPress} onChange={onChange} onFocus={onFocus}/>
  );
};

export {NumericInput};

