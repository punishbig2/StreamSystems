import {SizeHeaderProps} from 'components/Run/columnData';
import React, {useState, useEffect} from 'react';
import {DualTableHeader} from 'components/dualTableHeader';

import strings from 'locales';
import {NumericInput} from 'components/NumericInput';
import {sizeFormatter} from 'utils/sizeFormatter';

type Props = SizeHeaderProps & { onSubmit: (input: HTMLInputElement) => void };
export const SizeHeader: React.FC<Props> = (props: Props) => {
  const [internalValue, setInternalValue] = useState<number | null>(props.value);
  const onBlur = () => {
  };

  useEffect(() => {
    setInternalValue(props.value);
  }, [props.value]);

  const onChange = (value: string | null) => {
    if (value === '' || value === null) {
      setInternalValue(props.value);
    } else {
      const numeric: number = Number(value);
      if (isNaN(numeric))
        return;
      if (numeric >= props.minimum)
        props.onChange(numeric);
      setInternalValue(numeric);
    }
  };

  return (
    <DualTableHeader label={strings.Size} action={
      () => (
        <div className={'header-size'}>
          <NumericInput type={'size'}
                        value={sizeFormatter(internalValue)}
                        onBlur={onBlur}
                        onChange={onChange}
                        onSubmit={props.onSubmit}/>
        </div>
      )
    }/>
  );
};
