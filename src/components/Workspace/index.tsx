import {HTMLSelect} from '@blueprintjs/core';
import {ModalWindow} from 'components/ModalWindow';
import {OrderEntry} from 'components/OrderEntry';
import {Title} from 'components/Tile';
import {TOBTile} from 'components/TOBTile';
import {Toolbar} from 'components/Toolbar';
import {Content} from 'components/Workspace/content';
import {Tile} from 'components/Workspace/tile';
import {EntryTypes} from 'interfaces/mdEntry';
import {Order} from 'interfaces/order';
import {Product} from 'interfaces/product';
import {ITile} from 'interfaces/tile';
import {User} from 'interfaces/user';
import strings from 'locales';
import React, {ReactElement, useState} from 'react';
import {Mosaic, MosaicBranch, MosaicNode, MosaicWindow} from 'react-mosaic-component';
import {connect, MapStateToProps} from 'react-redux';
import {Dispatch} from 'redux';
import {Action} from 'redux/action';
import {createAction} from 'redux/actionCreator';
import {ApplicationState} from 'redux/applicationState';
import {TileTypes} from 'redux/constants/workareaConstants';
import {WorkspaceAction} from 'redux/constants/workspaceConstants';
import {createTileReducer} from 'redux/reducers/tileReducer';
import {Node, WorkspaceState} from 'redux/stateDefs/workspaceState';
import {injectNamedReducer} from 'redux/store';
import {$$} from 'utils/stringPaster';

interface DispatchProps {
  addTile: (type: TileTypes) => void;
  updateTree: (tree: Node) => void;
}

interface OwnProps {
  id: string;
  // Global data
  symbols: string[],
  products: Product[],
  tenors: string[],
  // FIXME: should be filled from the authentication process
  user: User;
}

const addTile = (id: string, type: TileTypes): Action<string> => {
  const tile: Tile = new Tile(type);
  // Inject the tile reducer ...
  injectNamedReducer(tile.id, createTileReducer);
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

const Workspace: React.FC<OwnProps> = withRedux((props: OwnProps & DispatchProps & WorkspaceState): ReactElement | null => {
  const [orderTicket, setOrderTicket] = useState<Order | null>(null);
  const {user, tiles} = props;
  const renderTile = (onOrderWindowRequested: (type: EntryTypes, data: Order) => void) =>
    (id: string, path: MosaicBranch[]): JSX.Element => {
      const renderTOBTile = (id: string, path: MosaicBranch[], tile: ITile) => {
        const toolbar = <Title symbols={props.symbols} products={props.products} tenors={props.tenors} id={tile.id}/>;
        return (
          <MosaicWindow<string> title={''} path={path} toolbarControls={toolbar}>
            <TOBTile key={id} currentUser={user} onOrderWindowRequested={onOrderWindowRequested} data={[]}/>
          </MosaicWindow>
        );
      };

      if (!tiles)
        throw new Error('cannot determine the properties of the tiles (`tilesProps\') is null or undefined');
      const tile = tiles[id];
      if (!tile)
        throw new Error(`tile \`${id}' type not found in the map`);
      switch (tile.type) {
        case TileTypes.TOB:
          return renderTOBTile(id, path, tile);
        case TileTypes.MessageBlotter:
          return <div/>;
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

  const onOrderWindowRequested = (type: EntryTypes, data: Order) => {
    setOrderTicket(data);
  };

  const renderOrderTicket = () => {
    const placeOrder = (quantity: number) => {
      console.log(quantity);
      // props.createOrder({...orderTicket, quantity} as Order);
      // Remove the internal order ticket
      setOrderTicket(null);
    };
    return <OrderEntry order={orderTicket} onCancel={() => setOrderTicket(null)} onSubmit={placeOrder}/>;
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
          renderTile={renderTile(onOrderWindowRequested)}
          value={props.tree}
          onChange={onChange}
          zeroStateView={<div className={'zero-state'}/>}/>
      </Content>
      <ModalWindow render={renderOrderTicket} visible={orderTicket !== null}/>
    </React.Fragment>
  );
});

export {Workspace};
