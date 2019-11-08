export const dynamicStateMapper = <S, A>() => (state: A, {id}: { id: string }): S => {
  const generic: { [key: string]: any } = state as { [key: string]: any };
  if (generic.hasOwnProperty(id)) {
    return generic[id] as S;
  } else {
    return {} as S;
  }
};
