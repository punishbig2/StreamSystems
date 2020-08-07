import React, { ReactElement } from "react";
import { SortOrder } from "mobx/stores/tableStore";

interface Props {
  readonly direction: SortOrder;
  readonly onClick: () => void;
}

const SortIndicator: React.FC<Props> = (props: Props) => {
  const getIcon = (): ReactElement => {
    switch (props.direction) {
      case SortOrder.Descending:
        return <i className={"fa fa-sort-down"} />;
      case SortOrder.Ascending:
        return <i className={"fa fa-sort-up"} />;
      case SortOrder.None:
        return <i className={"fa fa-sort none"} />;
    }
  };

  const onClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.preventDefault();
    props.onClick();
  };

  return (
    <div className={"sort-indicator"} onMouseDownCapture={onClick}>
      {getIcon()}
    </div>
  );
};

export { SortIndicator };
