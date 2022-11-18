import React from 'react';

interface Props {
  position: 'end' | 'start';
  value: string | undefined;
  inputValue?: string;
}

const getFont = (style: CSSStyleDeclaration): string => {
  if (style.font !== '') return style.font;
  return [style.fontStyle, style.fontSize, style.fontFamily].join(' ');
};

export const Adornment: React.FC<Props> = (props: Props): React.ReactElement | null => {
  const { value, inputValue, position } = props;
  const [element, setElement] = React.useState<HTMLDivElement | null>(null);
  const [contentWidth, setContentWidth] = React.useState<number>(0);
  const style: React.CSSProperties = React.useMemo((): React.CSSProperties => {
    if (element === null || position === 'start') return {};
    const parent: HTMLElement | null = element.parentElement;
    if (parent === null) return {};
    return {
      left: contentWidth + 8,
    };
  }, [element, contentWidth, position]);
  React.useEffect((): void => {
    if (element === null || inputValue === '' || !inputValue) return;
    const style: CSSStyleDeclaration = getComputedStyle(element);
    const canvas: HTMLCanvasElement = document.createElement('canvas');
    const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
    if (ctx === null) return;
    ctx.font = getFont(style);
    const measure: TextMetrics = ctx.measureText(inputValue);
    setContentWidth(measure.width);
  }, [element, inputValue]);
  if (inputValue === undefined || value === '') return null;
  if (value === undefined || inputValue === '') return null;
  return (
    <div style={style} className={['input-adornment', position].join(' ')} ref={setElement}>
      {value}
    </div>
  );
};
