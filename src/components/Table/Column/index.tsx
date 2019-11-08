import {ColumnLayout} from 'components/Table/Column/layout';
import {SortIndicator} from 'components/Table/Column/SortIndicator';
import {SortDirection} from 'components/Table/index';
import React, {ReactElement} from 'react';

interface OwnProps {
  sortable?: boolean;
  filterable?: boolean;
  width: number;
  sortDirection?: SortDirection;
  onSorted: () => void;
}

type Props = React.PropsWithChildren<OwnProps>;

const Column: React.FC<Props> = (props: Props): ReactElement => {
  const getSortIndicator = (): ReactElement | null => {
    if (props.sortable) {
      if (props.sortDirection === undefined) {
        return <SortIndicator direction={SortDirection.None} onClick={props.onSorted}/>;
      } else {
        return <SortIndicator direction={props.sortDirection} onClick={props.onSorted}/>;
      }
    } else {
      return null;
    }
  };
  return (
    <ColumnLayout width={props.width}>
      <div>{props.children}</div>
      {getSortIndicator()}
    </ColumnLayout>
  );
};

export {Column};
