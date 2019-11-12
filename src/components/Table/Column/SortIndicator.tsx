import {SortDirection} from 'components/Table/index';
import React, {ReactElement} from 'react';

interface Props {
  direction: SortDirection;
  onClick: () => void;
}

const SortIndicator: React.FC<Props> = (props: Props) => {
  const getIcon = (): ReactElement => {
    switch (props.direction) {
      case SortDirection.Descending:
        return <i className={'fa fa-sort-down'}/>;
      case SortDirection.Ascending:
        return <i className={'fa fa-sort-up'}/>;
      case SortDirection.None:
        return <i className={'fa fa-sort none'}/>;
    }
  };
  return (
    <div className={'sort-indicator'} onClick={props.onClick}>{getIcon()}</div>
  );
};

export {SortIndicator};
