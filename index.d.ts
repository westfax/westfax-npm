declare module 'westfax' {
  export interface WestFaxConfig {
    baseUrl?: string;
    responseEncoding?: string;
    username?: string;
    password?: string;
    productId?: string;
    cookies?: boolean;
  }

  export interface SendFaxOptions {
    jobName?: string;
    header?: string;
    billingCode?: string;
    numbers: string | string[];
    file: string | Buffer | NodeJS.ReadableStream;
    filename?: string;
    csid?: string;
    ani?: string;
    startDate?: string;
    faxQuality?: 'Fine' | 'Normal';
    feedbackEmail?: string;
    callbackUrl?: string;
  }

  export interface FaxIdentifier {
    Id: string;
    Direction: 'Inbound' | 'Outbound';
  }

  export interface ApiResponse {
    Success: boolean;
    Result: any;
    Error?: string;
  }

  class WestFax {
    constructor(config?: WestFaxConfig);
    
    getProductId(): Promise<string | null>;
    getProductList(): Promise<ApiResponse>;
    getF2EProductList(): Promise<ApiResponse>;
    
    sendFax(options: SendFaxOptions): Promise<ApiResponse>;
    
    getFaxDocuments(faxIds: FaxIdentifier | FaxIdentifier[], format?: string): Promise<ApiResponse>;
    changeFaxFilterValue(faxIds: FaxIdentifier | FaxIdentifier[], filter: string): Promise<ApiResponse>;
    getFaxDescriptionsUsingIds(faxIds: FaxIdentifier | FaxIdentifier[]): Promise<ApiResponse>;
    getProductsWithInboundFaxes(filter?: string): Promise<ApiResponse>;
  }

  export default WestFax;
} 