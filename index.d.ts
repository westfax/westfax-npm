declare module 'westfax' {
  export class WestFaxError extends Error {
    status?: number;
    code?: string;
    response?: {
      status?: number;
      data?: unknown;
    };
    errorString?: string;
    infoString?: string;
  }

  export interface WestFaxConfig {
    baseUrl?: string;
    responseEncoding?: 'JSON' | 'XML' | 'json' | 'xml';
    username?: string;
    password?: string;
    /** Sent as the x-api-key header. Sandbox calls can use this instead of username and password. */
    apiKey?: string;
    productId?: string;
    cookies?: boolean;
    /** Request timeout in milliseconds. Defaults to 120000. */
    timeout?: number;
  }

  export interface FaxFileInput {
    data: Buffer | NodeJS.ReadableStream;
    filename?: string;
  }

  export interface SendFaxOptions {
    jobName?: string;
    header?: string;
    billingCode?: string;
    /**
     * Destination fax number(s). A string is one recipient. An array is sent as Numbers1, Numbers2, and so on.
     * Maximum of 20 numbers.
     */
    numbers: string | string[];
    file?: string | Buffer | NodeJS.ReadableStream | FaxFileInput;
    /** Additional documents, sent as Files1, Files2, and so on after `file`. */
    files?: Array<string | Buffer | NodeJS.ReadableStream | FaxFileInput>;
    filename?: string;
    productId?: string;
    csid?: string;
    ani?: string;
    startDate?: string;
    faxQuality?: 'Fine' | 'Normal';
    feedbackEmail?: string;
    /** Posted as CallBackUrl. */
    callbackUrl?: string;
    callBackUrl?: string;
  }

  export interface FaxIdentifier {
    Id: string;
    Direction: 'Inbound' | 'Outbound';
  }

  export interface ApiResponse<T = unknown> {
    Success: boolean;
    Result?: T;
    ErrorString?: string;
    InfoString?: string;
    Error?: string;
  }

  export interface FaxCallInfo {
    CallId?: string;
    CompletedUTC?: string | null;
    TermNumber?: string;
    OrigNumber?: string;
    TermCSID?: string;
    OrigCSID?: string;
    Result?: string;
    CallPageCount?: number;
    FilterFlag?: number;
  }

  export interface FaxDescription {
    Id: string;
    Direction?: 'Inbound' | 'Outbound';
    Date?: string;
    Status?: string;
    JobName?: string;
    PageCount?: number;
    FaxQuality?: string;
    FilterValue?: string;
    Tag?: string;
    FilesAvailable?: boolean;
    FaxCallInfoList?: FaxCallInfo[];
    [key: string]: unknown;
  }

  export interface FaxDocumentFile {
    FileContents?: string;
    [key: string]: unknown;
  }

  export interface FaxDocument {
    FaxFiles?: FaxDocumentFile[];
    [key: string]: unknown;
  }

  export interface Product {
    Id: string;
    Name?: string;
    ProductType?: string;
    InboundNumber?: string;
    [key: string]: unknown;
  }

  export type FaxFilter = 'None' | 'Retrieved' | 'Removed';
  export type FaxDirection = 'Inbound' | 'Outbound';
  export type FaxFormat = 'pdf' | 'tiff' | 'jpeg' | 'png' | 'gif';

  export interface DirectionQuery {
    faxDirection: FaxDirection;
    startDate: string;
    productId?: string;
  }

  export interface FaxUsageQuery {
    startDate: string;
    endDate: string;
    productId?: string;
  }

  export interface FaxSearchQuery {
    faxDirection?: FaxDirection;
    page?: number;
    count?: number;
    startDate?: string;
    endDate?: string;
    filter?: FaxFilter;
    productId?: string;
  }

  class WestFax {
    static PRODUCTION_BASE_URL: string;
    static LEGACY_BASE_URL: string;
    static SANDBOX_BASE_URL: string;
    static WestFaxError: typeof WestFaxError;

    baseUrl: string;
    responseEncoding: string;
    username: string;
    password: string;
    apiKey: string;
    productId: string;
    cookies: boolean;
    timeout: number;

    constructor(config?: WestFaxConfig);

    getProductId(): Promise<string | null>;
    getProductList(): Promise<ApiResponse<Product[]>>;
    getF2EProductList(): Promise<ApiResponse<Product[]>>;

    sendFax(options: SendFaxOptions): Promise<ApiResponse<string>>;

    getFaxDocuments(
      faxIds: FaxIdentifier | FaxIdentifier[] | string | string[],
      format?: FaxFormat
    ): Promise<ApiResponse<FaxDocument[]>>;
    changeFaxFilterValue(
      faxIds: FaxIdentifier | FaxIdentifier[] | string | string[],
      filter?: FaxFilter
    ): Promise<ApiResponse>;
    getFaxDescriptionsUsingIds(
      faxIds: FaxIdentifier | FaxIdentifier[] | string | string[]
    ): Promise<ApiResponse<FaxDescription[]>>;
    getProductsWithInboundFaxes(filter?: FaxFilter): Promise<ApiResponse>;

    getFaxIdentifiers(options: DirectionQuery): Promise<ApiResponse<FaxIdentifier[]>>;
    getFaxDescriptions(options: DirectionQuery): Promise<ApiResponse<FaxDescription[]>>;
    getFaxUsage(options: FaxUsageQuery): Promise<ApiResponse<Product>>;
    searchFaxes(options?: FaxSearchQuery): Promise<ApiResponse>;
  }

  export default WestFax;
  export { WestFax };
}
