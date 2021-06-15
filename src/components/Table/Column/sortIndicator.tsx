import React, { ReactElement } from "react";
import { SortDirection } from "types/sortDirection";

interface Props {
  readonly sortable: boolean;
  readonly direction?: SortDirection;
  readonly onClick: () => void;
}

const Icon: React.FC<{ direction: SortDirection }> = (props: {
  direction: SortDirection;
}): React.ReactElement => {
  switch (props.direction) {
    case SortDirection.Descending:
      return <i className={"fa fa-sort-up"} />;
    case SortDirection.Ascending:
      return <i className={"fa fa-sort-down"} />;
    case SortDirection.None:
      return <i className={"fa fa-sort none"} />;
  }
};

export const SortIndicator: React.FC<Props> = (props: Props) => {
  const { onClick } = props;
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect((): (() => void) | void => {
    const element: HTMLDivElement | null = ref.current;
    if (element === null) return;
    const onMouseDown = (event: MouseEvent): void => {
      event.stopPropagation();
      event.preventDefault();
      onClick();
    };
    element.addEventListener("mousedown", onMouseDown);
    return (): void => {
      element.removeEventListener("mousedown", onMouseDown);
    };
  }, [onClick, ref]);

  if (props.direction === undefined || !props.sortable) return null;
  return (
    <div className={"sort-indicator"} ref={ref}>
      <Icon direction={props.direction} />
    </div>
  );
};
