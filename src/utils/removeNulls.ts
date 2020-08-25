export const removeNulls = <T = any>(thing: T): T => {
  if (thing === null) return thing;
  const keys: [string, any][] = Object.entries(thing);
  return keys.reduce((accumulated: T, [key, value]: [string, any]): T => {
    if (value === null) {
      return accumulated;
    } else if (typeof value === "object") {
      return { ...accumulated, [key]: removeNulls(value) };
    }
    return { ...accumulated, [key]: value };
  }, {} as T);
};
