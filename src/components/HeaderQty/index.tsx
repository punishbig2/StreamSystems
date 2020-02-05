import {QtyHeader} from 'components/Run/columnData';
import React from 'react';
import {DualTableHeader} from 'components/dualTableHeader';

import strings from 'locales';
import {NumericInput} from 'components/NumericInput';
import {sizeFormatter} from 'utils/sizeFormatter';

type Props = QtyHeader & {onSubmitted: (input: HTMLInputElement) => void};
export const HeaderQty: React.FC<Props> = (props: Props) => {
  const onChange = (value: string | null) => {
    if (value === '' || value === null)
      props.onChange(null);
    else
      props.onChange(Number(value));
  };
  return (
    <DualTableHeader label={strings.Size} action={
      () => (
        <div className={'header-size'}>
          <NumericInput type={'size'}
                        value={sizeFormatter(props.value)}
                        onChange={onChange}
                        onSubmitted={props.onSubmitted}/>
        </div>
      )
    }/>
  );
};
