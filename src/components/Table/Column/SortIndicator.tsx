import {SortDirection} from 'components/Table/index';
import React, {ReactElement} from 'react';
import styled from 'styled-components';

interface Props {
  direction: SortDirection;
  onClick: () => void;
}

const Button = styled.div`
  height: 22px;
  width: 22px;
  border-radius: 11px;
  margin: 0 4px;
  line-height: 22px;
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
  .fa.none {
    opacity: 0.25;
  }
  &:hover {
    .fa.none {
      opacity: 1;
    }
  }
  &:active {
    transform: translateY(1px);
  }
`;

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
    <Button onClick={props.onClick}>{getIcon()}</Button>
  );
};

export {SortIndicator};
