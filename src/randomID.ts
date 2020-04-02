export const randomID = (): string => {
  const A: number = 'a'.charCodeAt(0);
  const Z: number = 'z'.charCodeAt(0);
  const characters: string[] = [];
  for (let i = 0; i < 16; ++i) {
    const code: number = Math.round((A + (Z - A) * Math.random()));
    characters.push(String.fromCharCode(code));
  }
  return characters.join('');
};
