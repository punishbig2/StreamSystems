import { PodRowProps } from 'columns/podColumns/common';
import { Tenor } from 'components/Table/CellRenderers/Tenor';
import { TableColumn } from 'components/Table/tableColumn';
import React from 'react';
import { PodRowStatus } from 'types/podRow';

export const TenorColumn = (): TableColumn => ({
  name: 'tenor',
  header: () => <div>&nbsp;</div>,
  render: ({ tenor, onTenorSelected, status }: PodRowProps) => {
    if (status !== PodRowStatus.Normal) {
      return (
        <div className="error-cell">
          <i className="fa fa-exclamation-triangle" />
        </div>
      );
    }
    return <Tenor tenor={tenor} onTenorSelected={onTenorSelected} />;
  },
  template: 'WWQ',
  width: 3,
});
