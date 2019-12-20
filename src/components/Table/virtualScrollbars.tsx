import {CustomScrollbars} from 'components/Table/customScrollbars';
import React from 'react';

export const CustomScrollbarsVirtualList = React.forwardRef((props, ref) => (
  <CustomScrollbars {...props} forwardedRef={ref}/>
));
