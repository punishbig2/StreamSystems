import { SortIndicator } from "components/Table/Column/sortIndicator";
import workareaStore from "mobx/stores/workareaStore";
import React, { CSSProperties, ReactElement, useCallback, useRef } from "react";
import strings from "locales";
import { SortDirection } from "types/sortDirection";

export enum ColumnType {
  Real,
  Fake,
}

interface OwnProps {
  name: string;
  width: number | string;
  movable: boolean;
  sortable?: boolean;
  filterable?: boolean;
  sortDirection?: SortDirection;
  type: ColumnType;
  onGrabbed: (element: HTMLDivElement, grabbedAt: number) => void;
  style?: CSSProperties;
  onSorted?: (name: string) => void;
  onFiltered?: (keyword: string) => void;
}

type Props = React.PropsWithChildren<OwnProps>;

const Column: React.FC<Props> = (props: Props): ReactElement => {
  const containerRef: React.Ref<HTMLDivElement> = useRef<HTMLDivElement>(null);
  const inputRef: React.Ref<HTMLInputElement> = useRef<HTMLInputElement>(null);
  const { name, width, movable, onGrabbed, onSorted } = props;

  const getFilterEditor = (): ReactElement | null => {
    if (!props.filterable) return null;
    let timer: number = setTimeout(() => null, 0);
    const onChange = ({
      target: { value },
    }: React.ChangeEvent<HTMLInputElement>) => {
      clearTimeout(timer);
      // Reset the timer
      timer = setTimeout(() => {
        if (props.onFiltered !== undefined) {
          props.onFiltered(value);
        }
      }, 300);
    };

    return (
      <input
        ref={inputRef}
        className={"filter"}
        placeholder={strings.Filter}
        readOnly={!workareaStore.connected}
        onChange={onChange}
      />
    );
  };

  const onMouseDown = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      if (event.target === inputRef.current) return;
      const element = containerRef.current;
      if (!movable || element === null) return;
      if (event.button !== 0) return;
      onGrabbed(element, event.clientX);
    },
    [containerRef, onGrabbed, movable]
  );

  React.useEffect((): void | (() => void) => {
    if (containerRef.current === null) return;
    const element = containerRef.current;
    element.addEventListener("mousedown", onMouseDown);
    return (): void => {
      element.removeEventListener("mousedown", onMouseDown);
    };
  }, [onMouseDown, containerRef]);
  const onSort = React.useCallback(
    (): void => (onSorted === undefined ? undefined : onSorted(name)),
    [onSorted, name]
  );

  const classes: string[] = ["th"];
  if (props.sortable) classes.push("sortable");
  if (props.movable) classes.push("movable");
  if (props.type === ColumnType.Fake) classes.push("fake");
  const style: CSSProperties = { width, ...props.style };
  return (
    <div className={classes.join(" ")} style={style} ref={containerRef}>
      <div className={"column"}>
        <div className={"label"}>{props.children}</div>
        <SortIndicator
          sortable={props.sortable === true}
          direction={props.sortDirection}
          onClick={onSort}
        />
      </div>
      {getFilterEditor()}
    </div>
  );
};

export { Column };
