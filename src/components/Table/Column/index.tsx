import { SortIndicator } from 'components/Table/Column/SortIndicator';
import { SortDirection } from 'components/Table/index';
import React, { CSSProperties, ReactElement } from 'react';
import strings from 'locales';

interface OwnProps {
  sortable?: boolean;
  filterable?: boolean;
  sortDirection?: SortDirection;
  onSorted: () => void;
  width: number | string;
  onFiltered: (keyword: string) => void;
}

type Props = React.PropsWithChildren<OwnProps>;

const Column: React.FC<Props> = (props: Props): ReactElement => {
  const { width } = props;
  const getSortIndicator = (): ReactElement | null => {
    if (props.sortable) {
      if (props.sortDirection === undefined) {
        return (<SortIndicator direction={SortDirection.None} onClick={props.onSorted}/>
        );
      } else {
        return (
          <SortIndicator direction={props.sortDirection} onClick={props.onSorted}/>);
      }
    } else {
      return null;
    }
  };
  const getFilterEditor = (): ReactElement | null => {
    if (!props.filterable)
      return null;
    let timer: number = setTimeout(() => null, 0);
    const onChange = ({
                        target: { value },
                      }: React.ChangeEvent<HTMLInputElement>) => {
      clearTimeout(timer);
      // Reset the timer
      timer = setTimeout(() => {
        props.onFiltered(value);
      }, 300);
    };
    return (
      <input className={'filter'} placeholder={strings.Filter} onChange={onChange}/>
    );
  };
  const classes: string = ['th', props.sortable && 'sortable'].join(' ');
  const style: CSSProperties = { width };
  return (
    <div className={classes.trim()} style={style}>
      <div className={'column'}>
        <div className={'label'}>{props.children}</div>
        {getSortIndicator()}
      </div>
      {getFilterEditor()}
    </div>
  );
};

export { Column };
