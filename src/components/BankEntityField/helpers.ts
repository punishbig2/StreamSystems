import { BankEntity } from "types/bankEntity";

const DummyBankEntity: BankEntity = {
  code: "",
  default: false,
  id: "",
  name: "",
};

export const getCurrentEntity = (
  code: string,
  entities: { [p: string]: BankEntity[] }
): BankEntity => {
  const flat: BankEntity[] = Object.values(
    entities
  ).reduce((current: BankEntity[], next: BankEntity[]): BankEntity[] => [
    ...current,
    ...next,
  ]);
  const found: BankEntity | undefined = flat.find(
    (entity: BankEntity): boolean => entity.code === code
  );
  if (found === undefined) {
    return DummyBankEntity;
  } else {
    return found;
  }
};

export const getDefaultEntity = (
  bank: string,
  entities: { [p: string]: BankEntity[] }
): BankEntity | undefined => {
  const list: BankEntity[] | undefined = entities[bank];
  if (list === undefined) return;
  return list.find((entity: BankEntity): boolean => entity.default);
};
