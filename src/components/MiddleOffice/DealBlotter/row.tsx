import { BlotterTypes } from 'columns/messageBlotter';
import { BlotterRowTypes, Row } from 'components/MessageBlotter/row';
import { Deal } from 'components/MiddleOffice/types/deal';
import deepEqual from 'deep-equal';
import React, { ReactElement } from 'react';

export interface RowProps {
  readonly row: Deal;
  readonly columns: any;
  readonly selected: boolean;
  readonly containerWidth: number;
  readonly totalWidth: number;
  readonly weight: number;
  readonly onClick: (deal: Deal) => void;
}

export const DealRow: React.FC<RowProps> = React.memo(
  (props: RowProps): ReactElement => {
    const { row } = props;
    return (
      <Row
        key={row.id}
        columns={props.columns}
        row={row}
        weight={props.weight}
        type={BlotterRowTypes.Normal}
        selected={props.selected}
        containerWidth={props.containerWidth}
        totalWidth={props.totalWidth}
        blotterType={BlotterTypes.Executions}
        onClick={props.onClick}
      />
    );
  },
  (prevProps: RowProps, nextProps: RowProps) => {
    if (prevProps.selected !== nextProps.selected) return false;
    if (prevProps.containerWidth !== nextProps.containerWidth) return false;
    if (prevProps.columns !== nextProps.columns) return false;
    return deepEqual(prevProps.row, nextProps.row);
  }
);
