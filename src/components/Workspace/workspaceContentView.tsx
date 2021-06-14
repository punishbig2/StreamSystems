import { BlotterTypes } from "columns/messageBlotter";
import { ErrorBox } from "components/ErrorBox";
import { MessageBlotter } from "components/MessageBlotter";
import { ModalWindow } from "components/ModalWindow";
import { PodTile } from "components/PodTile";
import { PodTileTitle } from "components/PodTile/title";
import { ReactTileManager } from "components/ReactTileManager";
import strings from "locales";
import { ContentStore, isPodTileStore } from "mobx/stores/contentStore";
import { PodStoreContext } from "mobx/stores/podStore";
import { TileStore } from "mobx/stores/tileStore";
import React from "react";
import { Symbol } from "types/symbol";
import { TileType } from "types/tileType";

interface Props {
  readonly tiles: ReadonlyArray<TileStore>;
  readonly isDefault: boolean;
  readonly errorMessage: string | null;
  readonly currencies: ReadonlyArray<Symbol>;
  readonly tenors: ReadonlyArray<string>;

  readonly onRemoveTile: (id: string) => void;
  readonly onCloseErrorModal: () => void;
}

const NotPodStoreError = new Error("not a pod tile store, but it should be");

export const WorkspaceContentView: React.FC<Props> = (
  props: Props
): React.ReactElement => {
  const getContentRenderer = (id: string, type: TileType) => {
    switch (type) {
      case TileType.PodTile:
        return (contentStore: ContentStore | null) => {
          if (isPodTileStore(contentStore)) {
            return (
              <PodStoreContext.Provider value={contentStore}>
                <PodTile currencies={props.currencies} tenors={props.tenors} />
              </PodStoreContext.Provider>
            );
          } else {
            throw NotPodStoreError;
          }
        };
      case TileType.MessageBlotter:
        return () => {
          return <MessageBlotter id={id} blotterType={BlotterTypes.Regular} />;
        };
    }
    throw new Error("invalid type of window specified");
  };

  const getTitleRenderer = (id: string, type: TileType) => {
    switch (type) {
      case TileType.PodTile:
        return (contentStore: ContentStore | null) => {
          if (isPodTileStore(contentStore)) {
            return (
              <PodStoreContext.Provider value={contentStore}>
                <PodTileTitle
                  strategies={contentStore.strategies}
                  currencies={props.currencies}
                />
              </PodStoreContext.Provider>
            );
          } else {
            throw NotPodStoreError;
          }
        };
      case TileType.MessageBlotter:
        return () => <h1>Blotter</h1>;
    }
    return () => null;
  };

  return (
    <div className={"workspace"}>
      <ReactTileManager
        tiles={props.tiles}
        getTitleRenderer={getTitleRenderer}
        getContentRenderer={getContentRenderer}
        isDefaultWorkspace={props.isDefault}
        onWindowClose={props.onRemoveTile}
      />
      <ModalWindow
        render={() => (
          <ErrorBox
            title={strings.ErrorModalTitle}
            message={props.errorMessage ?? ""}
            onClose={props.onCloseErrorModal}
          />
        )}
        isOpen={props.errorMessage !== null}
      />
    </div>
  );
};
