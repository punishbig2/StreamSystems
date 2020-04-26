import { observable, action } from 'mobx';
import { ColumnState } from 'components/Table/columnSpecification';
import { CSSProperties } from 'react';

interface MovingColumn {
  state: ColumnState;
  style: CSSProperties;
  offset: number;
}

export class HeaderStore {
  @observable movingColumn: MovingColumn | null = null;

  private lastPosition: number = 0;
  private containerWidth: number = 0;
  private columnWidth: number = 0;

  @action.bound
  private unsetGrabbedColumn() {
    this.movingColumn = null;
    this.lastPosition = 0;
    this.containerWidth = 0;
    this.columnWidth = 0;
  }

  @action.bound
  private updateGrabbedColumnOffset(delta: number) {
    if (this.movingColumn === null)
      return;
    const { offset, style } = this.movingColumn;
    const newOffset: number = Math.min(Math.max(offset + delta, 0), this.containerWidth - this.columnWidth);
    this.movingColumn = {
      ...this.movingColumn,
      offset: newOffset,
      style: {
        ...style,
        left: newOffset,
      },
    };
  }

  @action.bound
  public setGrabbedColumn(
    state: ColumnState,
    element: HTMLDivElement,
    grabbedAt: number,
    onColumnsOrderChange: (sourceIndex: number, targetIndex: number) => void,
  ) {
    const parent: HTMLDivElement = element.parentNode as HTMLDivElement;
    const onMove = (event: MouseEvent) => {
      const currentX: number = event.clientX;
      this.updateGrabbedColumnOffset(currentX - this.lastPosition);
      // Update last position
      this.lastPosition = currentX;
    };

    const onRelease = () => {
      console.log('mouse released!');
      document.removeEventListener('mouseup', onRelease, true);
      document.removeEventListener('mousemove', onMove, true);
      // Try to compute the position now?
      const items: HTMLDivElement[] = Array.from(parent.querySelectorAll('.th'));
      const movingItem: HTMLDivElement | null = parent.querySelector('.th.fake');
      if (movingItem === null)
        throw new Error('there must be a moving element ...');
      const sourceIndex: number = items.findIndex((item: HTMLDivElement) => item === element);
      const targetIndex: number = items
        .findIndex((el: HTMLDivElement): boolean => {
          const l: number = el.offsetLeft;
          const r: number = l + el.offsetWidth;
          // Find the element that we are "between"
          return movingItem.offsetLeft >= l && movingItem.offsetLeft < r;
        });
      if (sourceIndex !== targetIndex)
        onColumnsOrderChange(sourceIndex, targetIndex);
      // Reset the whole thing
      this.unsetGrabbedColumn();
    };

    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('mouseup', onRelease, true);
    const offset: number = element.offsetLeft;
    const style: CSSProperties = { left: offset, zIndex: Number.MAX_SAFE_INTEGER };
    // Set it up ;)
    this.movingColumn = { state, style, offset };
    this.containerWidth = parent.offsetWidth;
    this.columnWidth = element.offsetWidth;
    this.lastPosition = grabbedAt;
  }
}
