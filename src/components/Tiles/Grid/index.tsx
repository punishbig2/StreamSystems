import {defaultSize} from 'components/Tiles/constants';
import {Layout} from 'components/Tiles/Grid/layout';
import {GridProps} from 'components/Tiles/Grid/props';
import {GridState} from 'components/Tiles/Grid/state';
import {ReducerHelper} from 'components/Tiles/Grid/tileReducerHelper';
import {Geometry} from 'components/Tiles/Tile/geometry';
import {Props} from 'components/Tiles/Tile/props';
import React, {Children, PureComponent, ReactElement, ReactNode} from 'react';
import {arrayInsertAt} from 'utils';

class Grid extends PureComponent<GridProps, GridState> {
  public readonly state: GridState = {
    isDocked: new Map<any, boolean>(),
    tiles: new Array<ReactNode>(),
    currentlyDraggingTileKey: null,
  } as GridState;
  private reference: HTMLDivElement | null;

  public constructor(props: any) {
    super(props);
    this.reference = null;
  }

  public componentDidMount = (): void => {
    window.addEventListener('resize', this.onResize);
    this.extractChildren();
  };

  public componentDidUpdate = (prevProps: Readonly<GridProps>): void => {
    // If the call was triggered by a state change, ignore it
    if (prevProps === this.props)
      return;
    this.extractChildren();
  };

  public componentWillUnmount = (): void => {
    window.removeEventListener('resize', this.onResize);
  };

  public render = (): ReactNode => {
    const {tiles} = this.state;
    const initialReducer: ReducerHelper = {items: new Array<ReactNode>(), floatingCount: 0};
    const reduced: ReducerHelper = tiles.reduce(this.tilesReducer, initialReducer);
    return (
      <Layout ref={this.setReference}>
        {reduced.items}
      </Layout>
    );
  };

  private onResize = (): void => {
    const {reference} = this;
    if (reference === null)
      return;
    const geometry = Geometry.fromClientRect(reference.getBoundingClientRect());
    this.setState({boundingBox: geometry} as GridState);
  };

  private extractChildren = (): void => {
    const {props} = this;
    // Handle children within the state since this way we can
    this.setState({tiles: Children.toArray(props.children)} as GridState, this.onResize);
  };

  private setReference = (element: HTMLDivElement): void => {
    this.reference = element;
  };

  private computeGeometry = (index: number) => {
    const {boundingBox} = this.state;
    if (!boundingBox)
      return new Geometry(0, 0, 0, 0);
    const columnCount = Math.floor(boundingBox.width / (defaultSize + 2 /* account for the border */));
    const col = index % columnCount;
    const row = (index - col) / columnCount;
    // Return the position based on the tile index in the array
    return new Geometry(col * defaultSize, row * defaultSize, defaultSize, defaultSize);
  };

  private createNewIsDockedObject = (key: string, value: boolean): Map<string, boolean> => {
    const {state} = this;
    // Avoid horrible unreadable syntax
    const oldMap = state.isDocked;
    // Merge the old map with the new values in a new map
    return new Map<string, boolean>([...Array.from(oldMap.entries()), [key, value]]);
  };

  private setTileDocked = (key: string, value: boolean): void => {
    // FIXME: move slightly the tile when un-docking
    this.setState({isDocked: this.createNewIsDockedObject(key, value)});
  };

  private getIsDocked = (key: string | number | null): boolean => {
    const {isDocked} = this.state;
    if ((key === null) || !isDocked.has(key)) {
      // By default return true
      return true;
    } else {
      // Otherwise return the saved value
      return !!isDocked.get(key);
    }
  };

  private onTileGrabbed = (key: string) => {
    this.setState({currentlyDraggingTileKey: key} as GridState);
  };

  private findTileIndexByKey = (key: string): number => {
    const {tiles} = this.state;
    return tiles.findIndex((tile: ReactNode) => {
      const element: ReactElement = tile as ReactElement;
      // Compare the keys
      return element.key === key;
    })
  };

  private onTileReleased = (key: string) => {
    const {currentlyMakingRoomKey, tiles} = this.state;
    const finalState: GridState = {} as GridState;
    // Update the state immediately (not really)
    finalState.currentlyDraggingTileKey = null;
    // We should also attempt to dock it here if it can be docked
    if (currentlyMakingRoomKey && !this.getIsDocked(key)) {
      const source = this.findTileIndexByKey(key);
      const target = this.findTileIndexByKey(currentlyMakingRoomKey);
      // Swap the elements
      finalState.isDocked = this.createNewIsDockedObject(key, true);
      finalState.tiles = arrayInsertAt(tiles, source, target);
    }
    // Now set the state just once and thus re-render only once
    this.setState(finalState);
  };

  private onMakingRoom = (key: string) => {
    this.setState({currentlyMakingRoomKey: key} as GridState);
  };

  private tilesReducer = (reducer: ReducerHelper, child: ReactNode): ReducerHelper => {
    const element: ReactElement = child as ReactElement;
    const {state} = this;
    // Get original props
    const {props} = element;
    const {items} = reducer;
    // Get whether the element is tiles
    const isDocked: boolean = this.getIsDocked(element.key);
    // Update the number of floating items
    reducer.floatingCount += isDocked ? 0 : 1;
    // Add the new item to the array
    items.push(
      React.cloneElement(child as ReactElement, {
        id: element.key as string,
        render: props.render,
        title: props.title,
        onMakingRoom: this.onMakingRoom,
        setTileDocked: this.setTileDocked,
        onGrab: this.onTileGrabbed,
        onRelease: this.onTileReleased,
        geometry: isDocked ? this.computeGeometry(items.length - reducer.floatingCount) : props.geometry,
        isDraggingOneTile: state.currentlyDraggingTileKey !== null,
        isDocked: isDocked,
      } as Props)
    );
    return reducer;
  };
}

export default Grid;
