import React, { ReactElement } from "react";
import { SortOrder } from "types/sortOrder";

interface Props {
  readonly sortable: boolean;
  readonly direction?: SortOrder;
  readonly onClick: () => void;
}

const Icon: React.FC<{ direction: SortOrder }> = (props: {
  direction: SortOrder;
}): React.ReactElement => {
  switch (props.direction) {
    case SortOrder.Descending:
      return <i className={"fa fa-sort-down"} />;
    case SortOrder.Ascending:
      return <i className={"fa fa-sort-up"} />;
    case SortOrder.None:
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
