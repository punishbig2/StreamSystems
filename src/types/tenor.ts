export interface Tenor {
  name: string;
  expiryDate: Date;
  deliveryDate?: Date;
  spotDate?: Date;
}

export interface InvalidTenor {
  name: string;
  expiryDate: null;
  deliveryDate: null;
  spotDate: null;
}
