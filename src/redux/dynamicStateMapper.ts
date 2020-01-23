export interface Identifiable {
  id: string;
}

const identity = <S, P extends Identifiable, A>(
  globalState: A,
  props: P,
): S => {
  const generic: { [key: string]: any } = globalState;
  if (generic.hasOwnProperty(props.id)) return generic[props.id];
  return {} as S;
};

type SliceFn<S, P extends Identifiable, A> = (globalState: A, props: P) => S;

export const dynamicStateMapper = <S, P extends Identifiable, A>(
  nextSlice: SliceFn<S, P, A> = identity,
) => (state: A, props: P): S => {
  return nextSlice(state, props);
};
