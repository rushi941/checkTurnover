declare global {
  namespace Express {
    interface ParamsDictionary {
      shopId: string;
      purchaseId: string;
    }
  }
}

export {};
