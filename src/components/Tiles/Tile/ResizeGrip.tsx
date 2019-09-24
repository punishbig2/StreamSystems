import React, {Component, ReactNode} from 'react';
import styled from 'styled-components';

const Grip = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  border-width: 3px;
  border-style: solid;
  border-color: transparent;
  border-bottom-color: red;
  border-right-color: red;
  cursor: se-resize;
`;

export interface RGProps {
  size: number;
  onResize: (amountX: number, amountY: number) => void;
}

interface RGState {
  pivotX: number;
  pivotY: number;
}

export class ResizeGrip extends Component<RGProps, RGState> {
  private reference: HTMLDivElement | null = null;

  private onResizing = (event: MouseEvent): void => {
    const {pivotX, pivotY} = this.state;
    const {props} = this;
    // Stop the default event
    event.preventDefault();
    // Move the offset to the right place
    this.setState({pivotX: event.clientX, pivotY: event.clientY} as RGState);
    // Call the callback
    props.onResize(event.clientX - pivotX, event.clientY - pivotY);
  };

  private clearListeners = (): void => {
    const {reference} = this;
    if (reference) {
      reference.removeEventListener('mouseup', this.clearListeners);
      // The document one
      document.removeEventListener('mousemove', this.onResizing);
    }
  };

  private onStartResizing = (event: MouseEvent): void => {
    const {reference} = this;
    if (reference) {
      // This is document wide of course
      document.addEventListener('mousemove', this.onResizing);
      // Ensure that this wont stay forever
      reference.addEventListener('mouseup', this.clearListeners);
      // Update the state pivot
      this.setState({pivotX: event.clientX, pivotY: event.clientY} as RGState);
    }
  };

  public componentDidMount = (): void => {
    const {reference} = this;
    if (reference) {
      reference.addEventListener('mousedown', this.onStartResizing);
    }
  };

  public componentWillUnmount = (): void => {
    const {reference} = this;
    if (reference) {
      reference.removeEventListener('mousedown', this.onStartResizing);
    }
    // Other listener can be cleaned in some cases
    this.clearListeners();
  };

  private setReference = (reference: HTMLDivElement): void => {
    this.reference = reference;
  };

  public render = (): ReactNode => {
    const {props} = this;
    return (
      <Grip ref={this.setReference} style={{width: props.size, height: props.size}}/>
    );
  }
}
