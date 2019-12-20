import React, {ReactElement} from 'react';
import {ListChildComponentProps} from 'react-window';

export const Child: (props: any, rowProps: any) => React.FC<ListChildComponentProps> = (props: any, rowProps: any) =>
  (childProps: ListChildComponentProps): ReactElement | null => {
    return props.renderRow({...rowProps[childProps.index], ...childProps});
  };
