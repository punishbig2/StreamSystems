import React, {PureComponent, ReactNode} from 'react';
import {TitleBar} from './TitleBar';
import {ResizeGrip} from './ResizeGrip';
import {Content} from './Content';
import {Layout} from './Layout';
import {ITileProps} from '../ITileProps';
import {Props} from './Props';
import {Geometry} from './Geometry';
import {CSSProperties} from 'styled-components';
import {Container} from "./Container";
import {defaultSize} from "../constants";

class TileState {
  public grabX: number | undefined;
  public grabY: number | undefined;
  public isGrabbed: boolean = false;
  public isMakingRoom: boolean = false;
  public geometry: Geometry = new Geometry(0, 0, 0, 0);

  constructor() {
    this.isGrabbed = false;
  }
}

// FIXME: handle scroll
class Tile extends PureComponent<Readonly<ITileProps>, Readonly<TileState>> {
  private reference: HTMLDivElement | null = null;
  public state = new TileState();

  private onGrab = (event: MouseEvent): void => {
    const props = this.getProps();
    // Install event listeners
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onRelease);
    // Set new state
    this.setState({
      grabX: event.clientX,
      grabY: event.clientY,
      isGrabbed: true,
    } as TileState);
    // Call the passed handler
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
    // Call the passed handler
    props.onRelease(props.id);
  };

  private getProps = (): Readonly<Props> => {
    const {props} = this;
    return props as Readonly<Props>;
  };

  private drag = (event: MouseEvent, state: TileState): void => {
    const {geometry} = state;
    const props = this.getProps();
    if (geometry === undefined || state.grabX === undefined || state.grabY === undefined)
      return;
    const x = event.clientX - state.grabX;
    const y = event.clientY - state.grabY;
    // Ignore the default action
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

  private onMouseEnter = (): void => {
    const {reference} = this;
    const {geometry} = this.state;
    const props = this.getProps();
    if (!props.isDocked || !props.isDraggingOneTile)
      return;
    if (reference) {
      const onMouseMove = (event: MouseEvent) => {
        if (event.offsetX < geometry.width / 4) {
          this.setState({isMakingRoom: true} as TileState);
          // Notify the parent object
          props.onMakingRoom(props.id);
        } else {
          this.setState({isMakingRoom: false} as TileState);
          // Clear the making room key in the parent
          props.onMakingRoom(null);
        }
      };
      const onMouseLeave = () => {
        reference.removeEventListener('mouseup', onMouseLeave);
        reference.removeEventListener('mouseleave', onMouseLeave);
        reference.removeEventListener('mousemove', onMouseMove);
        this.setState({isMakingRoom: false} as TileState);
      };
      reference.addEventListener('mouseup', onMouseLeave)
      reference.addEventListener('mouseleave', onMouseLeave)
      reference.addEventListener('mousemove', onMouseMove);
    }
  };

  private onMouseMove = (event: MouseEvent): void => {
    const {state} = this;
    if (state.isGrabbed) {
      this.drag(event, state);
    }
  };

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

  private setReference = (reference: HTMLDivElement): void => {
    this.reference = reference;
  };

  private onResize = (amountX: number, amountY: number): void => {
    const {geometry} = this.state;
    this.setState({
      geometry: geometry.resize(amountX, amountY),
    });
  };

  private onMinimize = (): void => {
  };

  public render = (): ReactNode => {
    const props: Props = this.getProps();
    // Get the geometry
    return (
      <Layout ref={this.setReference} style={this.getStyle(props, this.state)} id={props.id}>
        <Container>
          <TitleBar
            title={props.title}
            toggleDock={() => props.setTileDocked(props.id, false)}
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
  }
}

export default Tile;
