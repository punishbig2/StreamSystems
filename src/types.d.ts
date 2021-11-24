declare module "@dwqs/react-virtual-list" {
  interface Props {
    readonly itemCount: number;
    readonly estimatedItemHeight: number;
    readonly renderItem: (
      index: number,
      isScrolling: boolean
    ) => React.ReactElement | null;
  }

  export default function VirtualizedList(props: Props): JSX.Element;
}
