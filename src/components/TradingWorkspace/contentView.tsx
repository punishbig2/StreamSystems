import { BlotterTypes } from 'columns/messageBlotter';
import { ErrorBox } from 'components/ErrorBox';
import { MessageBlotter } from 'components/MessageBlotter';
import { ExportButton } from 'components/MessageBlotter/controls/exportButton';
import { ModalWindow } from 'components/ModalWindow';
import { PodTile } from 'components/PodTile';
import { PodTileTitle } from 'components/PodTile/title';
import { ReactTileManager } from 'components/ReactTileManager';
import strings from 'locales';
import { ContentStore, isMessageBlotterStore, isPodTileStore } from 'mobx/stores/contentStore';
import { MessageBlotterStoreContext } from 'mobx/stores/messageBlotterStore';
import { PodStoreContext } from 'mobx/stores/podStore';
import { TileStore } from 'mobx/stores/tileStore';
import React, { ReactElement } from 'react';
import { FXSymbol } from 'types/FXSymbol';
import { TileType } from 'types/tileType';

interface Props {
  readonly tiles: readonly TileStore[];
  readonly isDefault: boolean;
  readonly errorMessage: string | null;
  readonly currencies: readonly FXSymbol[];
  readonly tenors: readonly string[];
  readonly visible: boolean;

  readonly onRemoveTile: (id: string) => void;
  readonly onCloseErrorModal: () => void;
}

const NotPodStoreError = new Error('not a pod tile store, but it should be');
const NotMessageBlotterStoreError = new Error('not a message blotter store, but it should be');

export const ContentView: React.FC<Props> = (props: Props): React.ReactElement => {
  const getContentRenderer = (
    id: string,
    type: TileType
  ): ((_: ContentStore | null) => React.ReactElement) => {
    switch (type) {
      case TileType.PodTile:
        return function PodTileContentView(contentStore: ContentStore | null): React.ReactElement {
          if (isPodTileStore(contentStore)) {
            return (
              <PodStoreContext.Provider value={contentStore}>
                <PodTile
                  visible={props.visible}
                  currencies={props.currencies}
                  tenors={props.tenors}
                />
              </PodStoreContext.Provider>
            );
          } else {
            throw NotPodStoreError;
          }
        };
      case TileType.MessageBlotter:
        return function MessageBlotterContentView(
          contentStore: ContentStore | null
        ): React.ReactElement {
          if (isMessageBlotterStore(contentStore)) {
            return (
              <MessageBlotterStoreContext.Provider value={contentStore}>
                <MessageBlotter id={id} blotterType={BlotterTypes.MessageMonitor} />
              </MessageBlotterStoreContext.Provider>
            );
          } else {
            throw NotMessageBlotterStoreError;
          }
        };
    }
    throw new Error('invalid type of window specified');
  };

  const getTitleRenderer = (
    id: string,
    type: TileType
  ): ((contentStore: ContentStore | null) => React.ReactElement | null) => {
    switch (type) {
      case TileType.PodTile:
        return function PodTileTitleView(
          contentStore: ContentStore | null
        ): React.ReactElement | null {
          if (isPodTileStore(contentStore)) {
            return (
              <PodStoreContext.Provider value={contentStore}>
                <PodTileTitle strategies={contentStore.strategies} currencies={props.currencies} />
              </PodStoreContext.Provider>
            );
          } else {
            throw NotPodStoreError;
          }
        };
      case TileType.MessageBlotter:
        return function MessageBlotterTitleView(
          contentStore: ContentStore | null
        ): React.ReactElement | null {
          if (isMessageBlotterStore(contentStore)) {
            return (
              <MessageBlotterStoreContext.Provider value={contentStore}>
                <div className="execution-blotter-title">
                  <h1>Blotter</h1>
                  <ExportButton blotterType={BlotterTypes.MessageMonitor} />
                  <div style={{ width: 18 }} />
                </div>
              </MessageBlotterStoreContext.Provider>
            );
          } else {
            throw NotMessageBlotterStoreError;
          }
        };
    }

    return (): ReactElement | null => null;
  };

  return (
    <div className="workspace">
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
            message={props.errorMessage ?? ''}
            onClose={props.onCloseErrorModal}
          />
        )}
        isOpen={props.errorMessage !== null}
      />
    </div>
  );
};
