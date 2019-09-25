import {defaultSize} from 'components/Tiles/constants';
import {ITileProps} from 'components/Tiles/ITileProps';
// Internal imports (within the same directory)
import {Container} from 'components/Tiles/Tile/container';
import {Content} from 'components/Tiles/Tile/content';
import {Geometry} from 'components/Tiles/Tile/geometry';
import {Layout} from 'components/Tiles/Tile/layout';
import {Props} from 'components/Tiles/Tile/props';
import {ResizeGrip} from 'components/Tiles/Tile/resizeGrip';
import {TitleBar} from 'components/Tiles/Tile/TitleBar';
import React, {PureComponent, ReactNode} from 'react';
import {CSSProperties} from 'styled-components';

class TileState {
  public grabX?: number;
  public grabY?: number;
  public geometry: Geometry = new Geometry(0, 0, 0, 0);
  public isMakingRoom: boolean = false;
  public isGrabbed: boolean = false;
}

// FIXME: handle scroll
class Tile extends PureComponent<Readonly<ITileProps>, Readonly<TileState>> {
  public state = new TileState();
  private reference: HTMLDivElement | null = null;
  private timer: number | undefined;

  public componentWillUnmount = (): void => {
    const {reference} = this;
    if (reference) {
      reference.removeEventListener('mouseenter', this.onMouseEnter);
    }
    this.onRelease();
  };

  public componentDidMount = () => {
    const {reference} = this;
    const props = this.getProps();
    // Initialize geometry from props
    this.setState({geometry: props.geometry});
    // Install an efficient mouse tracker
    if (reference) {
      reference.addEventListener('mouseenter', this.onMouseEnter);
    }
  };

  public componentDidUpdate = (prevProps: Readonly<ITileProps>): void => {
    // We only care if the props have changed
    if (prevProps !== this.props) {
      const oldProps: Props = prevProps as Props;
      const newProps: Props = this.getProps();
      if (newProps.geometry) {
        // If the geometry is changed by the manager just update it here
        if (newProps.geometry !== oldProps.geometry) {
          // Reset geometry
          this.setState({geometry: newProps.geometry} as TileState);
        }
      }
    }
  };

  private static getClassName = (props: Props): string | undefined => props.isDocked ? undefined : 'floating';

  public render = (): ReactNode => {
    const props: Props = this.getProps();
    // Get the geometry
    return (
      <Layout
        ref={this.setReference}
        className={Tile.getClassName(props)}
        style={this.getStyle(props, this.state)}
        id={props.id}>
        <Container className={Tile.getClassName(props)}>
          <TitleBar
            title={props.title}
            onToggleDocking={() => props.setTileDocked(props.id, !props.isDocked)}
            onGrab={this.onGrab}
            isDocked={props.isDocked}
            onMinimize={this.onMinimize}/>
          <Content>
            {props.render(props)}
          </Content>
          {/* Docked tiles can't be resized */}
          {!props.isDocked && <ResizeGrip onResize={this.onResize} size={defaultSize / 24}/>}
        </Container>
      </Layout>
    );
  };

  private getProps = (): Readonly<Props> => {
    const {props} = this;
    return props as Readonly<Props>;
  };

  private resetTimer = (): void => {
    clearTimeout(this.timer);
    this.timer = undefined;
  };

  private drag = (event: MouseEvent): void => {
    const {state} = this;
    const {geometry} = state;
    if (geometry === undefined || state.grabX === undefined || state.grabY === undefined)
      return;
    const props = this.getProps();
    // Pre-compute the new `x' and `y'
    const x = event.clientX - state.grabX;
    const y = event.clientY - state.grabY;
    // Ignore the default action
    event.stopPropagation();
    event.preventDefault();
    // Update geometry
    const newGeometry = geometry.moveTo(x, y);
    // Update the internal state
    this.setState({
      geometry: newGeometry,
      grabX: event.clientX,
      grabY: event.clientY,
    } as TileState);
    // If we're tiles we should let the grid know that it has to let us free
    if (props.isDocked) {
      // Tell our parent that we've moved
      props.setTileDocked(props.id, false);
    }
  };

  private executeMakeRoom = (x: number): any => {
    const {geometry} = this.state;
    const props = this.getProps();
    return new Promise((resolve) => {
      if (x < geometry.width / 4) {
        this.timer = setTimeout(() => {
          this.setState({isMakingRoom: true} as TileState);
          resolve(props.id);
        }, 300);
      } else {
        this.setState({isMakingRoom: false} as TileState);
        resolve(null);
      }
    });
  };

  private makeRoomIfNeeded = (event: MouseEvent) => {
    const props = this.getProps();
    // Cancel any previous timer
    this.resetTimer();
    // Get the id if any, or null
    this.executeMakeRoom(event.offsetX)
      .then((id: string | null) => {
        // Now we have the correct id
        props.onMakingRoom(id);
      })
    ;
  };

  private onGrab = (event: React.MouseEvent): void => {
    const props = this.getProps();
    // Install event listeners
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onRelease);
    // Set new state
    this.setState({
      grabX: event.clientX,
      grabY: event.clientY,
    } as TileState);
    props.onGrab(props.id);
  };

  private onRelease = () => {
    const props = this.getProps();
    // Uninstall event listeners to prevent memory leaks
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onRelease);
    // Update the state
    this.setState({
      grabX: undefined,
      grabY: undefined,
      isGrabbed: false,
    } as TileState);
    props.onRelease(props.id);
  };

  private onMouseEnter = (): void => {
    const {reference} = this;
    const props = this.getProps();
    if (!props.isDocked || !props.isDraggingOneTile)
      return;
    if (reference) {
      const stopTryingToMakeRoom = () => {
        reference.removeEventListener('mousemove', this.makeRoomIfNeeded);
        reference.removeEventListener('mouseup', stopTryingToMakeRoom);
        reference.removeEventListener('mouseleave', stopTryingToMakeRoom);

        this.resetTimer();
        this.setState({isMakingRoom: false} as TileState);
      };
      reference.addEventListener('mousemove', this.makeRoomIfNeeded);
      reference.addEventListener('mouseup', stopTryingToMakeRoom);
      reference.addEventListener('mouseleave', stopTryingToMakeRoom);
    }
  };

  private onMouseMove = (event: MouseEvent): void => {
    const {state} = this;
    if (state.isGrabbed) {
      this.drag(event);
    } else {
      // Start moving after this ...
      this.setState({isGrabbed: true});
    }
  };

  private onResize = (amountX: number, amountY: number): void => {
    const {geometry} = this.state;
    this.setState({
      geometry: geometry.resize(amountX, amountY),
    });
  };

  private onMinimize = (): void => {
  };

  // Render helpers
  private setReference = (reference: HTMLDivElement): void => {
    this.reference = reference;
  };

  private getStyle = (props: Props, state: TileState): CSSProperties => {
    const geometry: Geometry = state.geometry;
    if (!geometry)
      return {};
    return {
      // Convert geometry to style
      ...geometry.toStyle(),
      // Docking based properties
      transition: props.isDocked ? undefined : 'none',
      zIndex: props.isDocked ? 1 : 2,
      boxShadow: props.isDocked ? 'none' : undefined,
      border: props.isDocked ? undefined : 'none',
      paddingLeft: state.isMakingRoom ? geometry.width / 4 : 0,
      // Disable pointer events while dragging to prevent the dragging
      // tile to catch the event instead of the docked tiles
      pointerEvents: state.isGrabbed ? 'none' : 'initial',
    }
  };
}

export default Tile;
