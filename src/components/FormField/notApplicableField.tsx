import { OutlinedInput } from '@material-ui/core';
import React from 'react';

export const NotApplicableField: React.FC = (): React.ReactElement => {
  return (
    <OutlinedInput
      labelWidth={0}
      classes={{
        root: 'not-applicable',
        notchedOutline: 'borderless',
      }}
      readOnly={true}
      inputProps={{ tabIndex: -1 }}
      value="N/A"
    />
  );
};
