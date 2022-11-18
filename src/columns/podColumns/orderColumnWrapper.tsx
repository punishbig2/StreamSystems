import { PodRowProps } from 'columns/podColumns/common';
import { OrderColumn, PodTableType } from 'columns/podColumns/OrderColumn';
import { TableColumn } from 'components/Table/tableColumn';
import React, { ReactElement } from 'react';
import { OrderTypes } from 'types/mdEntry';

export const OrderColumnWrapper = (
  label: string,
  type: OrderTypes,
  isDepth: boolean,
  action: () => ReactElement | null
): TableColumn => {
  return {
    name: `${type}-vol`,
    header: () => {
      const items: ReactElement[] = [
        <div className="price" key="1">
          {label}
        </div>,
      ];
      const actionItem: ReactElement | null = action();
      if (actionItem !== null) {
        if (type === OrderTypes.Bid) {
          items.unshift(
            <div className="size" key="2">
              {actionItem}
            </div>
          );
        } else if (type === OrderTypes.Ofr) {
          items.push(
            <div className="size" key="2">
              {actionItem}
            </div>
          );
        }
      } else {
        if (type === OrderTypes.Bid) {
          items.unshift(
            <div className="size" key="2">
              &nbsp;
            </div>
          );
        } else {
          items.push(
            <div className="size" key="2">
              &nbsp;
            </div>
          );
        }
      }
      return <div className="twin-header">{items}</div>;
    },
    render: (props: PodRowProps): React.ReactElement => {
      return (
        <OrderColumn
          type={type}
          currency={props.currency}
          strategy={props.strategy}
          tenor={props.tenor}
          orders={props.orders}
          defaultSize={props.defaultSize}
          minimumSize={props.minimumSize}
          forceEditable={props.id === '#special'}
          tableType={isDepth ? PodTableType.Dob : PodTableType.Pod}
        />
      );
    },
    template: '999999 999999.999',
    width: 13,
    className: 'twin-cell',
  };
};
