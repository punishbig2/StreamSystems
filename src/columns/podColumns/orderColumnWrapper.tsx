import {TOBColumnData} from 'components/PodTile/data';
import {DualTableHeader} from 'components/dualTableHeader';
import {ColumnSpec} from 'components/Table/columnSpecification';
import React, {ReactNode, ReactElement} from 'react';
import {RowType} from 'columns/podColumns/common';
import {OrderTypes} from 'interfaces/mdEntry';
import {OrderCellGroup} from 'columns/podColumns/orderColumn';

export const OrderColumnWrapper = (data: TOBColumnData, label: string, type: OrderTypes, isDepth: boolean, action?: () => ReactNode): ColumnSpec => {
  return {
    name: `${type}-vol`,
    header: () => {
      const items: ReactElement[] = [
        <DualTableHeader key={1} label={label} action={action} disabled={!data.buttonsEnabled} className={'price'}/>,
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
    render: (row: RowType) => (
      <OrderCellGroup
        type={type}
        personality={data.personality}
        aggregatedSize={data.aggregatedSize}
        isBroker={data.isBroker}
        bid={row.bid}
        ofr={row.ofr}
        depths={row.depths}
        defaultSize={data.defaultSize}
        minimumSize={data.minimumSize}
        isDepth={isDepth}
        onDoubleClick={data.onDoubleClick}/>
    ),
    template: '99999 999999.999',
    weight: 12,
  };
};
