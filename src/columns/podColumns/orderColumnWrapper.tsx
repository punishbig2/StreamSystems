import {DualTableHeader} from 'components/dualTableHeader';
import {ColumnSpec} from 'components/Table/columnSpecification';
import React, {ReactNode, ReactElement} from 'react';
import {PodRowProps} from 'columns/podColumns/common';
import {OrderTypes} from 'interfaces/mdEntry';
import {OrderCellGroup} from 'columns/podColumns/orderColumn';

export const OrderColumnWrapper = (label: string, type: OrderTypes, isDepth: boolean, action?: () => ReactNode): ColumnSpec => {
  return {
    name: `${type}-vol`,
    header: () => {
      const items: ReactElement[] = [
        <DualTableHeader key={1} label={label} action={action} disabled={false} className={'price'}/>,
      ];
      if (type === OrderTypes.Bid) {
        items.unshift(<DualTableHeader key={2} label={'Size'} className={'size'}/>);
      } else if (type === OrderTypes.Ofr) {
        items.push(<DualTableHeader key={2} label={'Size'} className={'size'}/>);
      }
      return (
        <div className={'twin-header'}>
          {items}
        </div>
      );
    },
    render: (props: PodRowProps) => (
      <OrderCellGroup
        type={type}
        personality={props.personality}
        aggregatedSize={props.aggregatedSize}
        isBroker={props.isBroker}
        bid={props.bid}
        ofr={props.ofr}
        depths={props.depths}
        defaultSize={props.defaultSize}
        minimumSize={props.minimumSize}
        isDepth={isDepth}/>
    ),
    template: '99999 999999.999',
    weight: 12,
  };
};
