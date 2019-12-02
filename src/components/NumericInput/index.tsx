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
}

const TableInput = <T extends any = string>(props: Props): ReactElement => {
  const {onReturnPressed, ...otherProps} = props;
  const onKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (onReturnPressed === undefined)
      return;
    if (event.key === 'Enter') {
      onReturnPressed();
    }
  };
  const onChange = ({target: {value}}: React.ChangeEvent<HTMLInputElement>) => props.onChange(value);
  return (
    <input {...otherProps} onKeyPress={onKeyPress} onChange={onChange}/>
  );
};

export {TableInput};

