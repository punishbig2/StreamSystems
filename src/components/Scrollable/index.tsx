import {useResizeObserver} from 'hooks/useResizeObserver';
import {useScroller} from 'hooks/useScroller';
import React, {CSSProperties, PropsWithChildren, ReactElement, useEffect, useMemo, useRef, useState} from 'react';

interface OwnProps {
  className: string;
}

const Scrollable: React.FC<Props> = (props: Props): ReactElement => {
  const reference: React.MutableRefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
  const position: number = useScroller(reference);
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [ratio, setRatio] = useState<number>(0);
  const [sliderPosition, setSliderPosition] = useState<number>(0);
  const [scrollTop, setScrollTop] = useState<number>(0);
  const [sliderHeight, setSliderHeight] = useState<number>(0);
  const [trackStyle, setTrackStyle] = useState<CSSProperties>({});
  const [containerSize, contentSize] = useResizeObserver(element);
  const {children} = props;
  // Base style forced on the container
  const style: CSSProperties = {overflow: 'hidden', position: 'relative'};
  // Update the ratio if the size has changed
  // FIXME: the only reason size changes is not the change in content, the
  //        size of the container might change
  useEffect(() => {
    if (contentSize === 0)
      return;
    const ratio: number = containerSize / contentSize;
    // Update the ratio container-size/content-size
    setRatio(ratio);
    // Compute the ideal slider size
    const sliderHeight: number = Math.round(ratio * containerSize);
    // Update slider size, if it's too small set a sensible minimum
    setSliderHeight(sliderHeight < 30 ? 30 : sliderHeight);
  }, [containerSize, contentSize]);
  // If the position changed, update related values
  useEffect(() => {
    const slider: HTMLDivElement | null = reference.current;
    if (element === null || slider === null)
      return;
    const fraction: number = position / (element.offsetHeight - slider.offsetHeight);
    // Do scroll now
    setScrollTop(Math.round(fraction * (element.scrollHeight - element.offsetHeight)));
    // Update slider style
    setSliderPosition(position);
  }, [reference, element, position]);
  // On every render this is the same, fuck react
  const sliderStyle: CSSProperties = useMemo(() => ({
    top: sliderPosition,
    height: sliderHeight,
  }), [sliderPosition, sliderHeight]);
  useEffect(() => {
    if (element === null)
      return;
    element.scrollTop = scrollTop;
    // Update track style too
    setTrackStyle({transform: `translateY(${scrollTop}px)`});
  }, [scrollTop, element]);
  // Get current scrollbar
  const getScrollbar = (): ReactElement | null => {
    if (ratio >= 1.0 || element === null)
      return null;
    return (
      <div className={'scrollbar-track'} style={trackStyle}>
        <div ref={reference} className={'scrollbar-slider'} style={sliderStyle}/>
      </div>
    );
  };
  return (
    <div ref={setElement} className={props.className} style={style}>
      {children}
      {getScrollbar()}
    </div>
  );
};

type Props = PropsWithChildren<OwnProps>;

export {Scrollable};
