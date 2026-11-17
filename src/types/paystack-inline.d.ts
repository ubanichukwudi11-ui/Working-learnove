declare module "@paystack/inline-js" {
  interface PaystackCallbacks {
    onSuccess?: (transaction: { reference: string; status?: string }) => void;
    onCancel?: () => void;
    onError?: (error: { message?: string }) => void;
  }

  export default class PaystackPop {
    resumeTransaction(accessCode: string, callbacks?: PaystackCallbacks): void;
  }
}
