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
}

const TableInput = <T extends any = string>(props: Props): ReactElement => {
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
    }
  };
  const onChange = ({target: {value}}: React.ChangeEvent<HTMLInputElement>) => props.onChange(value);
  return (
    <input {...otherProps} onKeyDown={onKeyPress} onChange={onChange}/>
  );
};

export {TableInput};

