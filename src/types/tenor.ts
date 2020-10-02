export interface Tenor {
  name: string;
  deliveryDate: Date;
  expiryDate: Date;
}

export interface InvalidTenor {
  name: string;
  deliveryDate: null;
  expiryDate: null;
}
