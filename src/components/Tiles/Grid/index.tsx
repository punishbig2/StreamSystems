import React, {Children, PureComponent, ReactElement, ReactNode} from 'react';
import styled from 'styled-components';
import {Geometry} from '../Tile/Geometry';
import {Props} from "../Tile/Props";
import {defaultSize} from "../constants";

const Layout = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
`;

interface GridState {
  boundingBox: Geometry;
  tiles: ReactNode[];
  currentlyDraggingTileKey: string | null;
  currentlyMakingRoomKey: string | null;
  isDocked: Map<any, boolean>;
}

interface GridProps {
}

// We use this as a helper structure to reduce the raw items
// to a more suitable form
interface ReducerHelper {
  items: ReactNode[];
  // Use memoization to prevent counting floating items
  floatingCount: number;
}

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

  private onResize = (): void => {
    const {reference} = this;
    if (reference === null)
      return;
    const geometry = Geometry.fromClientRect(reference.getBoundingClientRect());
    // Update manager's internal state
    this.setState({boundingBox: geometry} as GridState);
  };

  private extractChildren = (): void => {
    const {props} = this;
    // Handle children within the state
    this.setState({tiles: Children.toArray(props.children)} as GridState, this.onResize);
  };

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

  private setReference = (element: HTMLDivElement): void => {
    this.reference = element;
  };

  private computeGeometry = (index: number) => {
    const {boundingBox} = this.state;
    if (!boundingBox)
      return new Geometry(0, 0, 0, 0);
    const columnCount = Math.floor(boundingBox.width / defaultSize);
    const col = index % columnCount;
    const row = (index - col) / columnCount;
    // Return the position based on the tile index in the array
    return new Geometry(col * defaultSize, row * defaultSize, defaultSize, defaultSize);
  };

  private setTileDocked = (key: string, value: boolean): void => {
    console.log(key, value);
    this.setState((state: GridState) => {
      const oldMap = state.isDocked;
      const newMap = new Map([...Array.from(oldMap.entries()), [key, value]]);
      // Build the new state now
      return {isDocked: newMap} as GridState;
    });
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
    const {currentlyMakingRoomKey} = this.state;
    // Update the state immediately (not really)
    this.setState({currentlyDraggingTileKey: null} as GridState);
    // We should also attempt to dock it here if it can be docked
    if (currentlyMakingRoomKey) {
      const source = this.findTileIndexByKey(key);
      const target = this.findTileIndexByKey(currentlyMakingRoomKey);
      // Swap the elements
      this.setState((state: GridState) => {
        const {tiles} = state;
        const fn1 = (tile: ReactNode, index: number, array: ReactNode[]) => {
          if (index === target) {
            return array[source];
          } else if (index > target && index <= source) {
            return array[index - 1];
          } else {
            return array[index];
          }
        };
        const fn2 = (tile: ReactNode, index: number, array: ReactNode[]) => {
          if (index === target - 1) {
            return array[source];
          } else if (index >= source && index < target - 1) {
            return array[index + 1];
          } else {
            return array[index];
          }
        };
        return {
          tiles: tiles.map(target < source ? fn1 : fn2),
        };
      }, () => {
        this.setTileDocked(key, true);
      });
    }
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

  public render = (): ReactNode => {
    const {tiles} = this.state;
    const initialReducer: ReducerHelper = {items: new Array<ReactNode>(), floatingCount: 0};
    const reduced: ReducerHelper = tiles.reduce(this.tilesReducer, initialReducer);
    return (
      <Layout ref={this.setReference}>
        {reduced.items}
      </Layout>
    );
  }
}

export default Grid;
