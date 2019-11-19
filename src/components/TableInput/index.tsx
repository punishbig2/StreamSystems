import {Input} from 'components/TableInput/input';
import React, {ReactElement} from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onDoubleClick?: (event: React.MouseEvent) => void;
  onSubmit?: (value: string) => void;
  readOnly?: boolean;
  onBlur?: () => void;
  className?: string;
  tabIndex?: number;
}

const TableInput = <T extends any = string>(props: Props): ReactElement => {
  const {onSubmit, value, ...otherProps} = props;
  const onKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (value === null || onSubmit === undefined)
      return;
    if (event.key === 'Enter') {
      onSubmit(value.toString());
    }
  };
  const onChange = ({target: {value}}: React.ChangeEvent<HTMLInputElement>) => props.onChange(value);
  return (
    <Input
      {...otherProps}
      onBlur={props.onBlur}
      onChange={onChange}
      onKeyPress={onKeyPress}
      className={props.className}
      value={value}
      tabIndex={props.tabIndex}/>
  );
};

export {TableInput};

