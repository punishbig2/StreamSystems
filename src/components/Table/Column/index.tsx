import { SortIndicator } from 'components/Table/Column/SortIndicator';
import React, { CSSProperties, ReactElement, useRef } from 'react';
import strings from 'locales';
import { SortOrder } from 'mobx/stores/tableStore';

export enum ColumnType {
  Real,
  Fake,
}

interface OwnProps {
  name: string;
  width: number | string;
  movable: boolean;
  filterable?: boolean;
  sortable?: boolean;
  sortOrder?: SortOrder;
  type: ColumnType;
  style?: CSSProperties;
  onSorted: (name: string) => void;
  onFiltered: (keyword: string) => void;
  onGrabbed: (element: HTMLDivElement, grabbedAt: number) => void;
}

type Props = React.PropsWithChildren<OwnProps>;

const Column: React.FC<Props> = (props: Props): ReactElement => {
  const self: React.Ref<HTMLDivElement> = useRef<HTMLDivElement>(null);
  const { width } = props;

  const getSortIndicator = (): ReactElement | null => {
    const onSorted = () => props.onSorted(props.name);
    if (props.sortable) {
      if (props.sortOrder === undefined) {
        return (
          <SortIndicator direction={SortOrder.None} onClick={onSorted}/>
        );
      } else {
        return (
          <SortIndicator direction={props.sortOrder} onClick={onSorted}/>);
      }
    } else {
      return null;
    }
  };

  const getFilterEditor = (): ReactElement | null => {
    if (!props.filterable)
      return null;
    let timer: number = setTimeout(() => null, 0);
    const onChange = ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
      clearTimeout(timer);
      // Reset the timer
      timer = setTimeout(() => {
        props.onFiltered(value);
      }, 300);
    };
    const captureClick = (event: React.MouseEvent<HTMLInputElement>) => event.stopPropagation();
    return (
      <input className={'filter'} placeholder={strings.Filter} onChange={onChange} onMouseDownCapture={captureClick}/>
    );
  };

  const onMouseDown = props.movable ? (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (self.current === null)
      return;
    props.onGrabbed(self.current, event.clientX);
  } : undefined;

  const classes: string[] = ['th'];
  if (props.sortable)
    classes.push('sortable');
  if (props.movable)
    classes.push('movable');
  if (props.type === ColumnType.Fake)
    classes.push('fake');
  const style: CSSProperties = { width, ...props.style };
  return (
    <div className={classes.join(' ')} style={style} ref={self} onMouseDown={onMouseDown}>
      <div className={'column'}>
        <div className={'label'}>{props.children}</div>
        {getSortIndicator()}
      </div>
      {getFilterEditor()}
    </div>
  );
};

export { Column };
