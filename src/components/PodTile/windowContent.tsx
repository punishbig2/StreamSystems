import { ModalWindow } from 'components/ModalWindow';
import { DepthOfTheBook } from 'components/PodTile/depthOfTheBook';
import { TopOfTheBook } from 'components/PodTile/topOfTheBook';
import { ProgressModalContent } from 'components/ProgressModalContent';
import { TableColumn } from 'components/Table/tableColumn';
import { PodStore, PodStoreContext } from 'mobx/stores/podStore';
import { observer } from 'mobx-react';
import React, { ReactElement } from 'react';
import { DepthData } from 'types/depthData';
import { FXSymbol } from 'types/FXSymbol';
import { Order } from 'types/order';

interface Props {
  readonly columns: readonly TableColumn[];
  readonly strategy: string;
  readonly symbol: FXSymbol;
  readonly dob: DepthData;
  readonly loading: boolean;
}

export const WindowContent: React.FC<Props> = observer((props: Props): React.ReactElement => {
  const store = React.useContext<PodStore>(PodStoreContext);
  const { darkOrders, currentTenor } = store;

  const filteredDarkOrders = React.useMemo((): readonly Order[] => {
    if (currentTenor === null) {
      return [];
    }

    return darkOrders[currentTenor];
  }, [currentTenor, darkOrders]);

  const renderProgress = (): ReactElement | null => {
    if (store.currentProgress === null) return null;
    return (
      <ProgressModalContent
        startTime={store.operationStartedAt}
        message="Creating Orders"
        maximum={store.progressMax}
        progress={store.currentProgress}
      />
    );
  };

  return (
    <div className="pod-tile-content">
      <TopOfTheBook
        currentTenor={store.currentTenor}
        id={store.id}
        columns={props.columns}
        loading={store.loading || props.loading}
        rows={store.rows}
        symbol={props.symbol}
        strategy={props.strategy}
        orders={store.orders}
        onTenorSelected={store.setCurrentTenor}
        darkPoolOrders={store.darkOrders}
      />
      <DepthOfTheBook
        currentTenor={store.currentTenor}
        book={props.dob}
        symbol={props.symbol}
        strategy={props.strategy}
        darkOrders={filteredDarkOrders}
        onTenorSelected={store.setCurrentTenor}
      />
      <ModalWindow render={renderProgress} isOpen={store.isProgressWindowVisible} />
    </div>
  );
});
