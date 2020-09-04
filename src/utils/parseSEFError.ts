export interface SEFErrorEntry {
  key: string;
  value: string;
}

const extractKey = (value: string): string => {
  const trimmed: string = value.trim();
  const contentRegex: RegExp = /^\[[^=]+=\s*(.*)\s*]$/;
  const matches: string[] | null = trimmed.match(contentRegex);
  if (matches === null || matches.length === 1) return trimmed;
  const sections: string[] = matches[1]
    .split("/")
    .map((key: string): string => {
      const parts: string[] = key.split(":");
      if (parts.length === 1) return key;
      return parts[1];
    });
  return sections.join("/");
};

export const parseSEFError = (value: string): ReadonlyArray<SEFErrorEntry> => {
  const lines: string[] = value.split("\n");
  const parsed: { [index: number]: SEFErrorEntry } = lines.reduce(
    (
      value: { [index: number]: SEFErrorEntry },
      line: string,
      index: number
    ): any => {
      const key: number = (index - (index % 2)) / 2;
      const entry: SEFErrorEntry = value[key];
      if (index % 2 === 0) {
        return { ...value, [key]: { value: line, key: "unset" } };
      } else {
        return { ...value, [key]: { ...entry, key: extractKey(line) } };
      }
    },
    {}
  );
  return Object.values(parsed);
};
