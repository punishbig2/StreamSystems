import {ColumnSpec} from 'components/Table/columnSpecification';
import {PodRowProps} from 'columns/podColumns/common';
import {Tenor} from 'components/Table/CellRenderers/Tenor';
import React from 'react';

export const TenorColumn = (): ColumnSpec => ({
  name: 'tenor',
  header: () => <div>&nbsp;</div>,
  render: ({tenor, onTenorSelected}: PodRowProps) => (
    <Tenor tenor={tenor} onTenorSelected={onTenorSelected}/>
  ),
  template: 'WW',
  weight: 2,
});
