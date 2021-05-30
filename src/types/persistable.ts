export abstract class Persistable<T> {
  public static fromJson<T>(data: { [key: string]: any }): T {
    throw new Error("abstract method not implemented");
  }
  public abstract get serialized(): { [key: string]: any };
}

export const unserializeObject = <T>(
  generic: { [key: string]: any },
  fromJson: (data: { [key: string]: any }) => T
): { [key: string]: T } => {
  const keys = Object.keys(generic);
  return keys.reduce((result: { [key: string]: T }, key: string): {
    [key: string]: T;
  } => {
    return { ...result, [key]: fromJson(generic[key]) };
  }, {});
};

export const serializeObject = <T>(obj: {
  [key: string]: Persistable<T>;
}): { [key: string]: any } => {
  const entries = Object.entries(obj);
  return entries.reduce(
    (
      result: { [key: string]: any },
      [key, value]: [string, Persistable<T>]
    ): { [key: string]: any } => {
      return { ...result, [key]: value.serialized };
    },
    {}
  );
};
