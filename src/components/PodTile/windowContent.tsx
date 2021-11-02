import { ModalWindow } from "components/ModalWindow";
import { DepthOfTheBook } from "components/PodTile/depthOfTheBook";
import { TopOfTheBook } from "components/PodTile/topOfTheBook";
import { ProgressModalContent } from "components/ProgressModalContent";
import { TableColumn } from "components/Table/tableColumn";
import { observer } from "mobx-react";
import { PodStore, PodStoreContext } from "mobx/stores/podStore";
import React, { ReactElement } from "react";
import { DepthData } from "types/depthData";
import { Symbol } from "types/symbol";

interface Props {
  readonly columns: ReadonlyArray<TableColumn>;
  readonly strategy: string;
  readonly symbol: Symbol;
  readonly dob: DepthData;
  readonly loading: boolean;
}

export const WindowContent: React.FC<Props> = observer(
  (props: Props): React.ReactElement => {
    const store = React.useContext<PodStore>(PodStoreContext);

    const renderProgress = (): ReactElement | null => {
      if (store.currentProgress === null) return null;
      return (
        <ProgressModalContent
          startTime={store.operationStartedAt}
          message={"Creating Orders"}
          maximum={store.progressMax}
          progress={store.currentProgress}
        />
      );
    };

    return (
      <div className={"pod-tile-content"}>
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
          darkPoolOrders={store.darkPoolOrders}
        />
        <DepthOfTheBook
          currentTenor={store.currentTenor}
          book={props.dob}
          symbol={props.symbol}
          strategy={props.strategy}
          darkPoolOrders={store.darkPoolOrders}
          onTenorSelected={store.setCurrentTenor}
        />
        <ModalWindow
          render={renderProgress}
          isOpen={store.isProgressWindowVisible}
        />
      </div>
    );
  }
);
