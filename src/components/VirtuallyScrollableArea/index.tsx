import {useScroller} from 'hooks/useScroller';
import React, {
  Children,
  CSSProperties,
  PropsWithChildren,
  ReactElement,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';

interface OwnProps {
  className: string;
  itemCount: number;
}

const VirtuallyScrollableArea: React.FC<Props> = (props: Props): ReactElement => {
  const slider: React.MutableRefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
  const [fraction, offset]: [number, number] = useScroller(slider);

  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const [ratio, setRatio] = useState<number>(0);
  const [sliderHeight, setSliderHeight] = useState<number>(0);
  const getHeight = (element: Element) => element.clientHeight;
  const children: ReactNode[] = Children.toArray(props.children);

  // Get current scrollbar
  const sliderStyle: CSSProperties = {
    top: offset,
    height: sliderHeight,
  };

  const getScrollbar = (ratio: number): ReactElement | null => {
    if (ratio >= 1.0)
      return null;
    return (
      <div className={'scrollbar-track'}>
        <div ref={slider} className={'scrollbar-slider'} style={sliderStyle}/>
      </div>
    );
  };

  useEffect(() => {
    if (container === null)
      return;
    // FIXME: this should also change if the size changes ...
    const observer: MutationObserver = new MutationObserver(() => {
      if (container.firstElementChild !== null) {
        setVisibleCount(getHeight(container) / getHeight(container.firstElementChild));
      }
    });
    observer.observe(container, {childList: true});
    return () => observer.disconnect();
  }, [container]);

  useEffect(() => {
    const sliderElement: HTMLDivElement | null = slider.current;
    if (sliderElement === null)
      return;
    const parentNode: Element | null = sliderElement.parentElement;
    if (parentNode !== null) {
      setSliderHeight(parentNode.clientHeight * ratio);
    }
  }, [ratio, slider]);

  useEffect(() => {
    if (children.length === 0) {
      setRatio(1);
    } else {
      setRatio(visibleCount / children.length);
    }
  }, [visibleCount, children.length]);

  const startIndex: number = (() => {
    const value: number = Math.floor(fraction * (children.length - visibleCount));
    if (isNaN(value))
      return 0;
    return value;
  })();
  return (
    <div ref={setContainer} className={props.className}>
      {children.slice(startIndex, startIndex + visibleCount + 1)}
      {ratio < 1 && getScrollbar(ratio)}
    </div>
  );
};

type Props = PropsWithChildren<OwnProps>;

export {VirtuallyScrollableArea};
