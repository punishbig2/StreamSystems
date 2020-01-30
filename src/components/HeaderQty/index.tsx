import {QtyHeader} from 'components/Run/columnData';
import React from 'react';
import {DualTableHeader} from 'components/dualTableHeader';

import strings from 'locales';
import {NumericInput} from 'components/NumericInput';
import {sizeFormatter} from 'utils/sizeFormatter';

export const HeaderQty: React.FC<QtyHeader> = (props: QtyHeader) => {
  const onChange = (value: string | null) => {
    props.onChange(Number(value));
  };
  return (
    <DualTableHeader label={strings.Size} action={
      () => (
        <div className={'header-size'}>
          <NumericInput type={'size'} value={sizeFormatter(props.value)} onChange={onChange}/>
        </div>
      )
    }/>
  );
};
