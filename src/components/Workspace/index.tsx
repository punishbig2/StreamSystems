import {HTMLSelect} from '@blueprintjs/core';
import {MessageBlotter} from 'components/MessageBlotter';
import {TOBTile} from 'components/TOBTile';
import {Toolbar} from 'components/Toolbar';
import {Content} from 'components/Workspace/content';
import {Tile} from 'components/Workspace/tile';
import {Strategy} from 'interfaces/strategy';
import {User} from 'interfaces/user';
import strings from 'locales';
import React, {ReactElement} from 'react';
import {Mosaic, MosaicBranch, MosaicNode} from 'react-mosaic-component';
import {connect, MapStateToProps} from 'react-redux';
import {Dispatch} from 'redux';
import {Action} from 'redux/action';
import {createAction} from 'redux/actionCreator';
import {ApplicationState} from 'redux/applicationState';
import {TileTypes} from 'redux/constants/workareaConstants';
import {WorkspaceAction} from 'redux/constants/workspaceConstants';
import {createTileReducer} from 'redux/reducers/tileReducer';
import {TileState, TileStatus} from 'redux/stateDefs/tileState';
import {Node, WorkspaceState} from 'redux/stateDefs/workspaceState';
import {injectNamedReducer} from 'redux/store';
import {$$} from 'utils/stringPaster';

interface DispatchProps {
  addTile: (type: TileTypes) => void;
  updateTree: (tree: Node) => void;
}

interface OwnProps {
  id: string;
  // Global row
  symbols: string[],
  products: Strategy[],
  tenors: string[],
  // FIXME: should be filled from the authentication process
  user: User;
}

const addTile = (id: string, type: TileTypes): Action<string> => {
  const tile: Tile = new Tile(type);
  // Inject the tile reducer ...
  const initialState: TileState = {
    connected: false,
    oco: false,
    symbol: '',
    strategy: '',
    rows: {},
    status: TileStatus.None,
    orders: {},
  };
  injectNamedReducer(tile.id, createTileReducer, initialState);
  // Build-up the action
  return createAction($$(id, WorkspaceAction.AddTile), tile);
};

const mapStateToProps: MapStateToProps<WorkspaceState, OwnProps, ApplicationState> =
  (state: ApplicationState, ownProps: OwnProps): WorkspaceState => {
    const generalizedState = state as any;
    if (generalizedState.hasOwnProperty(ownProps.id)) {
      // Forcing typescript to listen to me >(
      return generalizedState[ownProps.id] as WorkspaceState;
    } else {
      return {} as WorkspaceState;
    }
  };

const mapDispatchToProps = (dispatch: Dispatch, {id}: OwnProps): DispatchProps => ({
  updateTree: (tree: Node) => dispatch(createAction($$(id, WorkspaceAction.UpdateTree), tree)),
  addTile: (type: TileTypes) => dispatch(addTile(id, type)),
});

const withRedux: (ignored: any) => any = connect<WorkspaceState, DispatchProps, OwnProps, ApplicationState>(
  mapStateToProps,
  mapDispatchToProps,
);

type Props = OwnProps & DispatchProps & WorkspaceState;
const Workspace: React.FC<OwnProps> = withRedux((props: Props): ReactElement | null => {
  const {tiles, user} = props;
  // Tile renderer function ...
  const renderTile = (id: string, path: MosaicBranch[]): JSX.Element => {
    if (!tiles)
      throw new Error('cannot determine the properties of the tiles (`tilesProps\') is null or undefined');
    const tile = tiles[id];
    if (!tile)
      throw new Error(`tile \`${id}' type not found in the map`);
    switch (tile.type) {
      case TileTypes.TOB:
        return (
          <TOBTile
            id={tile.id}
            onClose={() => null}
            symbols={props.symbols}
            products={props.products}
            tenors={props.tenors}
            user={user}
            path={path}/>
        );
      case TileTypes.MessageBlotter:
        return <MessageBlotter path={path} user={user} onClose={() => null}/>;
      default:
        throw new Error(`invalid tile type ${tile.type}`);
    }
  };

  const onChange = (tiles: string | MosaicNode<string> | null): void => {
    if (typeof tiles === 'string')
      return;
    props.updateTree(tiles as MosaicNode<string>);
  };

  const addTile = ({target: {value}}: { target: HTMLSelectElement }) => {
    switch (value) {
      case '1':
        props.addTile(TileTypes.TOB);
        break;
      case '2':
        props.addTile(TileTypes.MessageBlotter);
        break;
      case '3':
        props.addTile(TileTypes.Empty);
        break;
      default:
        break;
    }
  };

  return (
    <React.Fragment>
      <Toolbar>
        <HTMLSelect value={-1} onChange={addTile}>
          <option value={-1} disabled>{strings.AddNewWindow}</option>
          <option value={1}>TOB Window</option>
          <option value={2}>Message Blotter</option>
        </HTMLSelect>
      </Toolbar>
      <Content>
        <Mosaic<string>
          renderTile={renderTile}
          value={props.tree}
          onChange={onChange}
          zeroStateView={<div className={'zero-state'}/>}/>
      </Content>
    </React.Fragment>
  );
});

export {Workspace};
