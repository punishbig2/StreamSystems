import {SortIndicator} from 'components/Table/Column/SortIndicator';
import {SortDirection} from 'components/Table/index';
import React, {CSSProperties, ReactElement} from 'react';
import strings from 'locales';
import {theme} from 'theme';

interface OwnProps {
  sortable?: boolean;
  filterable?: boolean;
  sortDirection?: SortDirection;
  onSorted: () => void;
  width: number;
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
  const getFilterEditor = (): ReactElement | null => {
    if (!props.filterable)
      return null;
    return <input className={'filter'} placeholder={strings.Filter}/>;
  };
  const classes: string = ['th', props.sortable && 'sortable'].join(' ');
  const rowHeight: string = `${theme.tableHeaderHeight}px`;
  const style: CSSProperties = {width: `${props.width}%`};
  const labelStyle: CSSProperties = {lineHeight: rowHeight, height: rowHeight};
  return (
    <div className={classes} style={style}>
      <div className={'column'} style={labelStyle}>
        <div className={'label'}>{props.children}</div>
        {getSortIndicator()}
      </div>
      {getFilterEditor()}
    </div>
  );
};

export {Column};
