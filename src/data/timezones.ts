export interface TimezoneInfo {
  text: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Intl {
    function supportedValuesOf(key: string): any;
  }
}

const iannaTimeZones = Intl.supportedValuesOf('timeZone');

export default iannaTimeZones
  .sort((a: string, b: string) => a.localeCompare(b))
  .map((text: string) => ({ text } as TimezoneInfo));
