import { DepthOfTheBook } from "components/PodTile/depthOfTheBook";
import { TopOfTheBook } from "components/PodTile/topOfTheBook";
import { TableColumn } from "components/Table/tableColumn";
import { observer } from "mobx-react";
import { PodStore, PodStoreContext } from "mobx/stores/podStore";
import React, { ReactElement } from "react";
import { DepthData } from "types/depthData";
import { PodTable } from "types/podTable";
import { Symbol } from "types/symbol";
import { ModalWindow } from "components/ModalWindow";
import { ProgressModalContent } from "components/ProgressModalContent";

interface Props {
  readonly columns: ReadonlyArray<TableColumn>;
  readonly strategy: string;
  readonly symbol: Symbol;
  readonly dob: DepthData;
}

export const WindowContent: React.FC<Props> = observer(
  (props: Props): React.ReactElement => {
    const store = React.useContext<PodStore>(PodStoreContext);
    const { dob } = props;
    const dobRows = React.useMemo((): PodTable => dob.rows, [dob]);

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

    React.useEffect((): void => {
      if (Object.keys(dobRows).length === 0 && store.currentTenor !== null) {
        store.setCurrentTenor(null);
      }
    }, [dobRows, store]);

    return (
      <div className={"pod-tile-content"}>
        <TopOfTheBook
          currentTenor={store.currentTenor}
          id={store.id}
          columns={props.columns}
          loading={store.loading}
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
