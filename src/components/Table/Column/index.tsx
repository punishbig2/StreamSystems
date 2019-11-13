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
  onFiltered: (keyword: string) => void;
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
  /*
    added:  1f8f614f-7024-4b29-a2ab-e42ed403017c
    added:  86eaca78-0cf8-4852-b011-ce50f2bf1b16
   */
  const getFilterEditor = (): ReactElement | null => {
    if (!props.filterable)
      return null;
    let timer: number = setTimeout(() => null, 0);
    const onChange = ({target: {value}}: React.ChangeEvent<HTMLInputElement>) => {
      clearTimeout(timer);
      // Reset the timer
      timer = setTimeout(() => {
        props.onFiltered(value);
      }, 300);
    };
    return <input className={'filter'} placeholder={strings.Filter} onChange={onChange}/>;
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
