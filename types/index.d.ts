declare namespace RvImageOptimizeTypes {
  type ImageFormat = 'jpg' | 'jpeg' | 'png' | 'gif' | 'webp' | 'avif' | 'bmp' | 'svg';
  type OutputImageFormat = 'jpeg' | 'png' | 'webp' | 'avif';
  type CdnType = 'aliyun' | 'tencent' | 'qiniu' | 'upyun' | 'cloudfront' | string;
  type UploadValueType =
    | 'text'
    | 'file'
    | 'fileName'
    | 'fileType'
    | 'fileSize'
    | 'originalFileName'
    | 'originalFileSize'
    | 'compressedFileName'
    | 'compressedFileType'
    | 'compressedFileSize'
    | 'savedSize'
    | 'savedPercentage';

  interface OptimizeOptions {
    width?: number | null;
    height?: number | null;
    quality?: number;
    format?: ImageFormat | 'auto' | null;
    autoFormat?: boolean;
    compressionLevel?: number;
    blur?: number;
    smooth?: boolean;
    fit?: string;
    [key: string]: unknown;
  }

  interface ResponsiveImageOptions extends OptimizeOptions {
    breakpoints?: number[];
    sizes?: string;
    fallbackWidth?: number;
  }

  interface ResponsiveImageResult {
    src: string;
    srcset: string;
    sizes: string;
    format: string | null;
    originalUrl: string;
  }

  interface ProgressiveStage {
    width?: number | null;
    height?: number | null;
    quality?: number;
    format?: ImageFormat | 'auto' | null;
    autoFormat?: boolean;
    blur?: number;
    [key: string]: unknown;
  }

  interface ImageComparisonResult {
    originalUrl: string;
    optimizedUrl: string;
    originalSize: number | null;
    optimizedSize: number | null;
    originalSizeFormatted: string | null;
    optimizedSizeFormatted: string | null;
    savedSize: number | null;
    savedSizeFormatted: string | null;
    savedPercentage: number | null;
  }

  interface BrowserCompressionOptions extends OptimizeOptions {
    mimeType?: string;
    outputType?: string;
    fileName?: string;
    preserveExif?: boolean;
    enableCanvasSmoothing?: boolean;
    maxWidth?: number | null;
    maxHeight?: number | null;
  }

  interface BrowserCompressionResult {
    file: File;
    blob: Blob;
    url?: string;
    originalSize: number;
    compressedSize: number;
    savedSize: number;
    savedPercentage: number;
    compressedFileName?: string;
    compressedFormat?: string;
    [key: string]: unknown;
  }

  interface ProgressiveLoadOptions {
    stages?: ProgressiveStage[];
    timeout?: number;
    enableCache?: boolean;
    urlTransformer?: (url: string, stage: ProgressiveStage, stageIndex: number) => string;
    onStageComplete?: (stageIndex: number, stageUrl: string, stage: ProgressiveStage) => void;
    onStageError?: (error: Error, stageIndex: number, stageUrl: string, stage: ProgressiveStage) => string | null | void;
    onComplete?: (finalUrl: string) => void;
    onError?: (error: Error, stageIndex: number) => void;
    [key: string]: unknown;
  }

  interface ProgressiveLoadResult {
    url: string;
    stages: Array<{
      url: string;
      stage: ProgressiveStage;
      loaded: boolean;
    }>;
    success: boolean;
    error: Error | null;
  }

  interface CacheWriteOptions {
    checkQuota?: boolean;
    autoCleanOnQuotaError?: boolean;
  }

  interface CacheStats {
    count: number;
    totalSize: number;
    totalSizeMB: number;
    expiredCount: number;
  }

  interface StorageQuotaResult {
    quota?: number;
    usage?: number;
    available?: boolean;
    message?: string;
    [key: string]: unknown;
  }

  interface DatabaseUsageItem {
    dbName: string;
    usage: number;
    usageMB?: number;
    stores?: string[];
    [key: string]: unknown;
  }

  interface LazyImageOptimizationInfo extends ImageComparisonResult {
    cdnType?: CdnType | null;
    finalUrl?: string;
    usedBrowserCompression?: boolean;
    [key: string]: unknown;
  }

  interface LazyImageProps {
    src: string;
    alt?: string;
    width?: string | number;
    height?: string | number;
    className?: string;
    imageClassName?: string;
    dataId?: string | number | null;
    imageStyle?: import('react').CSSProperties;
    immediate?: boolean;
    rootMargin?: string;
    optimize?: OptimizeOptions;
    enableBrowserCompression?: boolean;
    showPlaceholderIcon?: boolean;
    showErrorMessage?: boolean;
    errorSrc?: string | null;
    progressive?: boolean;
    progressiveStages?: ProgressiveStage[];
    progressiveTransitionDuration?: number;
    progressiveTimeout?: number;
    progressiveEnableCache?: boolean;
    onLoad?: (event: import('react').SyntheticEvent<HTMLImageElement>, optimizationInfo: LazyImageOptimizationInfo | null) => void;
    onOptimization?: (optimizationInfo: LazyImageOptimizationInfo | null) => void;
    onError?: (error: Error | import('react').SyntheticEvent<HTMLImageElement>) => void;
    onClick?: (event: import('react').MouseEvent<HTMLDivElement | HTMLImageElement>, imageInfo: LazyImageOptimizationInfo | null) => void;
    onProgressiveStageComplete?: (stageIndex: number, stageUrl: string, stage: ProgressiveStage) => void;
  }

  interface ProgressiveImageProps {
    src: string;
    alt?: string;
    width?: string | number;
    height?: string | number;
    className?: string;
    imageClassName?: string;
    imageStyle?: import('react').CSSProperties;
    stages?: ProgressiveStage[];
    transitionDuration?: number;
    timeout?: number;
    enableCache?: boolean;
    showPlaceholder?: boolean;
    onStageComplete?: (stageIndex: number, stageUrl: string, stage: ProgressiveStage) => void;
    onComplete?: (finalUrl: string) => void;
    onError?: (error: Error, stageIndex: number) => void;
    onLoad?: (event: import('react').SyntheticEvent<HTMLImageElement>) => void;
  }

  interface ImageValidationFormatResult {
    valid: boolean;
    format: string | null;
    errors: string[];
  }

  interface ImageValidationSizeResult {
    valid: boolean;
    size: number;
    errors: string[];
  }

  interface ImageValidationFileResult extends ImageValidationFormatResult {
    size: number;
  }

  interface LosslessCompressOptions {
    format?: OutputImageFormat | 'auto' | null;
    quality?: number;
    maxWidth?: number | null;
    maxHeight?: number | null;
    preserveAnimation?: boolean;
    allowedFormats?: string[];
    strict?: boolean;
    maxSize?: number | null;
    minSize?: number;
    [key: string]: unknown;
  }

  interface LosslessCompressionResult {
    file: File;
    blob: Blob;
    originalSize: number;
    compressedSize: number;
    savedSize: number;
    savedPercentage: number;
    compressedFileName?: string;
    compressedFormat?: string;
    width?: number | null;
    height?: number | null;
    [key: string]: unknown;
  }

  interface LosslessCompressionBatchItem {
    success: boolean;
    source: Blob | File | string;
    result?: LosslessCompressionResult;
    error?: Error;
  }

  interface LosslessComparisonResult {
    originalSize: number;
    compressedSize: number;
    savedSize: number;
    savedPercentage: number;
    result: LosslessCompressionResult;
  }

  interface LosslessSuitabilityResult {
    suitable: boolean;
    reasons: string[];
    recommendation?: string;
    [key: string]: unknown;
  }

  interface GPUSupportInfo {
    supported: boolean;
    method: string | null;
    details?: Record<string, boolean>;
    reason: string;
  }

  interface NodeCompressOptions {
    format?: OutputImageFormat | 'auto' | null;
    quality?: number;
    compressionLevel?: number;
    maxWidth?: number | null;
    maxHeight?: number | null;
    fit?: string;
    withoutEnlargement?: boolean;
    suffix?: string;
    outputDir?: string;
    outputPath?: string;
    overwrite?: boolean;
    recursive?: boolean;
    preserveStructure?: boolean;
    concurrency?: number;
    deleteOriginal?: boolean;
    replaceOriginal?: boolean;
    inputPath?: string;
    sourceFileName?: string | null;
    outputFileName?: string | null;
    originalSize?: number | null;
    [key: string]: unknown;
  }

  interface NodeCompressResult {
    buffer: Uint8Array;
    inputPath: string | null;
    outputPath: string | null;
    sourceFileName: string | null;
    compressedFileName: string | null;
    mimeType: string;
    originalWidth: number | null;
    originalHeight: number | null;
    originalFormat: string | null;
    originalSize: number | null;
    originalSizeFormatted: string | null;
    compressedWidth: number | null;
    compressedHeight: number | null;
    compressedFormat: string;
    compressedSize: number;
    compressedSizeFormatted: string | null;
    savedSize: number | null;
    savedSizeFormatted: string | null;
    savedPercentage: number | null;
    isEffective: boolean | null;
    originalDeleted?: boolean;
    replacedOriginal?: boolean;
  }

  interface NodeDirectoryCompressItem {
    inputPath: string;
    success: boolean;
    result?: NodeCompressResult;
    error?: string;
  }

  interface NodeDirectoryCompressResult {
    inputDir: string;
    outputDir: string;
    total: number;
    success: number;
    failed: number;
    items: NodeDirectoryCompressItem[];
  }

  interface UploadFormField {
    id?: string;
    key: string;
    valueType?: UploadValueType;
    textValue?: string;
  }

  interface UploadConfig {
    url?: string;
    method?: string;
    authorization?: string;
    headers?: Record<string, string | number | boolean | null | undefined>;
    dataMode?: 'formFields' | 'jsonTemplate';
    formFields?: UploadFormField[];
    jsonTemplate?: string | Record<string, unknown> | unknown[];
    fileFieldKey?: string;
  }

  interface NormalizedUploadConfig {
    url: string;
    method: string;
    authorization: string;
    headers: Record<string, string>;
    dataMode: 'formFields' | 'jsonTemplate';
    formFields: Array<Required<Pick<UploadFormField, 'id' | 'key'>> & UploadFormField>;
    jsonTemplate: string;
    fileFieldKey: string;
  }

  interface UploadContext {
    file: File | Blob;
    fileName: string;
    fileType: string;
    fileSize: number;
    originalFileName?: string;
    originalFileSize?: number;
    compressedFileName?: string;
    compressedFileType?: string;
    compressedFileSize?: number;
    savedSize?: number | string;
    savedPercentage?: number | string;
    [key: string]: unknown;
  }

  interface UploadPayloadPreviewEntry {
    key: string;
    source: string;
    isFile: boolean;
    previewValue: string;
  }

  interface UploadPayloadPreview {
    mode: 'formFields' | 'jsonTemplate';
    headers: Record<string, string>;
    body: unknown;
    entries?: UploadPayloadPreviewEntry[];
    [key: string]: unknown;
  }

  interface UploadRequestResult<T = unknown> {
    status: number;
    ok: boolean;
    data: T;
    response: Response;
  }

  interface CompressAndUploadProgress {
    completed: number;
    total: number;
    currentIndex: number;
    result: CompressAndUploadResultItem;
  }

  interface CompressAndUploadRuntimeOptions {
    concurrency?: number;
    onProgress?: (progress: CompressAndUploadProgress) => void;
  }

  interface CompressAndUploadFailure {
    message: string;
    response: unknown;
  }

  interface CompressAndUploadResultItem {
    sourceFile: File;
    success: boolean;
    compressionResult?: LosslessCompressionResult & UploadContext;
    uploadResult?: UploadRequestResult;
    error?: CompressAndUploadFailure;
  }
}

declare module 'rv-image-optimize' {
  export type ImageFormat = RvImageOptimizeTypes.ImageFormat;
  export type OutputImageFormat = RvImageOptimizeTypes.OutputImageFormat;
  export type CdnType = RvImageOptimizeTypes.CdnType;
  export type UploadValueType = RvImageOptimizeTypes.UploadValueType;

  export interface OptimizeOptions extends RvImageOptimizeTypes.OptimizeOptions {}
  export interface ResponsiveImageOptions extends RvImageOptimizeTypes.ResponsiveImageOptions {}
  export interface ResponsiveImageResult extends RvImageOptimizeTypes.ResponsiveImageResult {}
  export interface ProgressiveStage extends RvImageOptimizeTypes.ProgressiveStage {}
  export interface ImageComparisonResult extends RvImageOptimizeTypes.ImageComparisonResult {}
  export interface BrowserCompressionOptions extends RvImageOptimizeTypes.BrowserCompressionOptions {}
  export interface BrowserCompressionResult extends RvImageOptimizeTypes.BrowserCompressionResult {}
  export interface ProgressiveLoadOptions extends RvImageOptimizeTypes.ProgressiveLoadOptions {}
  export interface ProgressiveLoadResult extends RvImageOptimizeTypes.ProgressiveLoadResult {}
  export interface CacheWriteOptions extends RvImageOptimizeTypes.CacheWriteOptions {}
  export interface CacheStats extends RvImageOptimizeTypes.CacheStats {}
  export interface StorageQuotaResult extends RvImageOptimizeTypes.StorageQuotaResult {}
  export interface DatabaseUsageItem extends RvImageOptimizeTypes.DatabaseUsageItem {}
  export interface LazyImageOptimizationInfo extends RvImageOptimizeTypes.LazyImageOptimizationInfo {}
  export interface LazyImageProps extends RvImageOptimizeTypes.LazyImageProps {}
  export interface ProgressiveImageProps extends RvImageOptimizeTypes.ProgressiveImageProps {}
  export interface UploadFormField extends RvImageOptimizeTypes.UploadFormField {}
  export interface UploadConfig extends RvImageOptimizeTypes.UploadConfig {}
  export interface NormalizedUploadConfig extends RvImageOptimizeTypes.NormalizedUploadConfig {}
  export interface UploadContext extends RvImageOptimizeTypes.UploadContext {}
  export interface UploadPayloadPreviewEntry extends RvImageOptimizeTypes.UploadPayloadPreviewEntry {}
  export interface UploadPayloadPreview extends RvImageOptimizeTypes.UploadPayloadPreview {}
  export interface UploadRequestResult<T = unknown> extends RvImageOptimizeTypes.UploadRequestResult<T> {}
  export interface CompressAndUploadProgress extends RvImageOptimizeTypes.CompressAndUploadProgress {}
  export interface CompressAndUploadRuntimeOptions extends RvImageOptimizeTypes.CompressAndUploadRuntimeOptions {}
  export interface CompressAndUploadFailure extends RvImageOptimizeTypes.CompressAndUploadFailure {}
  export interface CompressAndUploadResultItem extends RvImageOptimizeTypes.CompressAndUploadResultItem {}

  export const DEFAULT_DB_NAME: string;
  export const DEFAULT_STORE_NAME_GENERAL: string;
  export const DEFAULT_CACHE_EXPIRE_HOURS: number;
  export const UPLOAD_VALUE_TYPES: UploadValueType[];
  export const UPLOAD_PLACEHOLDERS: Record<UploadValueType, string>;

  export function detectSupportedFormats(): string[];
  export function getBestFormat(preferredFormat?: string | null): string;
  export function detectImageFormat(url: string): string | null;
  export function optimizeImageUrl(url: string, options?: OptimizeOptions): string;
  export function generateSrcset(url: string, options?: ResponsiveImageOptions): string;
  export function generateSizes(options?: ResponsiveImageOptions): string;
  export function generateResponsiveImage(url: string, options?: ResponsiveImageOptions): ResponsiveImageResult;
  export function getOptimizedCoverUrl(coverUrl: string): string;
  export function preloadImage(url: string): Promise<HTMLImageElement>;
  export function preloadImages(urls: string[], concurrency?: number): Promise<Array<{ url: string; success: boolean; image?: HTMLImageElement; error?: Error }>>;
  export function loadImagesProgressively(imageList: string[], options?: Record<string, unknown>): Promise<unknown[]>;
  export function loadImagesBatch(urls: string[], options?: Record<string, unknown>): Promise<unknown[]>;
  export function generateBlurPlaceholderUrl(url: string, options?: OptimizeOptions): string;
  export function loadImageProgressive(url: string, options?: ProgressiveLoadOptions): Promise<ProgressiveLoadResult>;
  export function loadImagesProgressiveBatch(imageList: string[], options?: Record<string, unknown>): Promise<unknown[]>;
  export function compressImageInBrowser(imageSource: string | File | Blob | HTMLImageElement, options?: BrowserCompressionOptions): Promise<BrowserCompressionResult>;
  export function dataURLToBlob(dataURL: string): Blob;
  export function getImageSize(url: string): Promise<{ width: number; height: number; aspectRatio?: number } | null>;
  export function formatFileSize(bytes: number | null | undefined): string | null;
  export function detectCDN(url: string): CdnType | null;
  export function compareImageSizes(originalUrl: string, optimizedUrl: string): Promise<ImageComparisonResult>;

  export function setCache(
    key: string,
    value: unknown,
    expireHours?: number,
    dbName?: string,
    storeName?: string,
    options?: CacheWriteOptions,
  ): Promise<void>;
  export function getCache<T = unknown>(key: string, dbName?: string, storeName?: string): Promise<T | null>;
  export function deleteCache(key?: string | null, dbName?: string, storeName?: string): Promise<void>;
  export function cleanExpiredCache(dbName?: string, storeName?: string): Promise<number>;
  export function getCacheStats(dbName?: string, storeName?: string): Promise<CacheStats>;
  export function hasCache(key: string, dbName?: string, storeName?: string): Promise<boolean>;
  export function getStoreNames(dbName?: string): Promise<string[]>;
  export function deleteDatabase(dbName: string): Promise<void>;
  export function getAllDatabaseNames(): Promise<string[]>;
  export function getStorageQuota(): Promise<StorageQuotaResult>;
  export function checkStorageQuota(requiredSize?: number): Promise<StorageQuotaResult>;
  export function getAllDatabasesUsage(): Promise<DatabaseUsageItem[]>;
  export function loadImageWithCache(
    url: string,
    dbName?: string,
    storeName?: string,
    options?: Record<string, unknown>,
  ): Promise<string>;
  export function loadImageProgressiveWithCache(url: string, options?: ProgressiveLoadOptions): Promise<ProgressiveLoadResult>;

  export function normalizeUploadConfig(config?: UploadConfig): NormalizedUploadConfig;
  export function buildUploadContext(file: File | Blob, fileMeta?: Record<string, unknown>): UploadContext;
  export function buildUploadRequestHeaders(config?: UploadConfig): Record<string, string>;
  export function buildUploadFormData(
    file: File | Blob,
    fileMeta?: Record<string, unknown>,
    config?: UploadConfig,
  ): { formData: FormData; entries: UploadPayloadPreviewEntry[]; context: UploadContext };
  export function createUploadPayloadPreview(
    file: File | Blob,
    fileMeta?: Record<string, unknown>,
    config?: UploadConfig,
  ): UploadPayloadPreview;
  export function uploadFileWithConfig<T = unknown>(
    file: File | Blob,
    fileMeta?: Record<string, unknown>,
    config?: UploadConfig,
  ): Promise<UploadRequestResult<T>>;
  export const uploadCompressedFile: typeof uploadFileWithConfig;
  export function compressAndUploadFiles(
    files: ArrayLike<File>,
    compressOptions?: RvImageOptimizeTypes.LosslessCompressOptions,
    uploadConfig?: UploadConfig,
    runtimeOptions?: CompressAndUploadRuntimeOptions,
  ): Promise<CompressAndUploadResultItem[]>;

  export const LazyImage: import('react').ComponentType<LazyImageProps>;
  export const ProgressiveImage: import('react').ComponentType<ProgressiveImageProps>;

  const defaultExport: typeof LazyImage;
  export default defaultExport;
}

declare module 'rv-image-optimize/utils-only' {
  export {
    DEFAULT_DB_NAME,
    DEFAULT_STORE_NAME_GENERAL,
    DEFAULT_CACHE_EXPIRE_HOURS,
    UPLOAD_VALUE_TYPES,
    UPLOAD_PLACEHOLDERS,
    detectSupportedFormats,
    getBestFormat,
    detectImageFormat,
    optimizeImageUrl,
    generateSrcset,
    generateSizes,
    generateResponsiveImage,
    getOptimizedCoverUrl,
    preloadImage,
    preloadImages,
    loadImagesProgressively,
    loadImagesBatch,
    generateBlurPlaceholderUrl,
    loadImageProgressive,
    loadImagesProgressiveBatch,
    compressImageInBrowser,
    dataURLToBlob,
    getImageSize,
    formatFileSize,
    detectCDN,
    compareImageSizes,
    setCache,
    getCache,
    deleteCache,
    cleanExpiredCache,
    getCacheStats,
    hasCache,
    getStoreNames,
    deleteDatabase,
    getAllDatabaseNames,
    getStorageQuota,
    checkStorageQuota,
    getAllDatabasesUsage,
    loadImageWithCache,
    loadImageProgressiveWithCache,
    normalizeUploadConfig,
    buildUploadContext,
    buildUploadRequestHeaders,
    buildUploadFormData,
    createUploadPayloadPreview,
    uploadFileWithConfig,
    uploadCompressedFile,
    compressAndUploadFiles,
  } from 'rv-image-optimize';
}

declare module 'rv-image-optimize/cache' {
  export {
    DEFAULT_DB_NAME,
    DEFAULT_STORE_NAME_GENERAL,
    DEFAULT_CACHE_EXPIRE_HOURS,
    setCache,
    getCache,
    deleteCache,
    cleanExpiredCache,
    getCacheStats,
    hasCache,
    getStoreNames,
    deleteDatabase,
    getAllDatabaseNames,
    getStorageQuota,
    checkStorageQuota,
    getAllDatabasesUsage,
    loadImageWithCache,
    loadImageProgressiveWithCache,
  } from 'rv-image-optimize';
}

declare module 'rv-image-optimize/upload-core' {
  export {
    UPLOAD_VALUE_TYPES,
    UPLOAD_PLACEHOLDERS,
    normalizeUploadConfig,
    buildUploadContext,
    buildUploadRequestHeaders,
    buildUploadFormData,
    createUploadPayloadPreview,
    uploadFileWithConfig,
    uploadCompressedFile,
  } from 'rv-image-optimize';
}

declare module 'rv-image-optimize/upload' {
  export {
    UPLOAD_VALUE_TYPES,
    UPLOAD_PLACEHOLDERS,
    normalizeUploadConfig,
    buildUploadContext,
    buildUploadRequestHeaders,
    buildUploadFormData,
    createUploadPayloadPreview,
    uploadFileWithConfig,
    uploadCompressedFile,
    compressAndUploadFiles,
  } from 'rv-image-optimize';

  const defaultExport: {
    UPLOAD_VALUE_TYPES: import('rv-image-optimize').UploadValueType[];
    UPLOAD_PLACEHOLDERS: Record<import('rv-image-optimize').UploadValueType, string>;
    normalizeUploadConfig: typeof import('rv-image-optimize').normalizeUploadConfig;
    buildUploadRequestHeaders: typeof import('rv-image-optimize').buildUploadRequestHeaders;
    buildUploadFormData: typeof import('rv-image-optimize').buildUploadFormData;
    createUploadPayloadPreview: typeof import('rv-image-optimize').createUploadPayloadPreview;
    uploadFileWithConfig: typeof import('rv-image-optimize').uploadFileWithConfig;
    uploadCompressedFile: typeof import('rv-image-optimize').uploadCompressedFile;
    compressAndUploadFiles: typeof import('rv-image-optimize').compressAndUploadFiles;
  };
  export default defaultExport;
}

declare module 'rv-image-optimize/lossless' {
  export type ImageValidationFormatResult = RvImageOptimizeTypes.ImageValidationFormatResult;
  export type ImageValidationSizeResult = RvImageOptimizeTypes.ImageValidationSizeResult;
  export type ImageValidationFileResult = RvImageOptimizeTypes.ImageValidationFileResult;
  export interface LosslessCompressOptions extends RvImageOptimizeTypes.LosslessCompressOptions {}
  export interface LosslessCompressionResult extends RvImageOptimizeTypes.LosslessCompressionResult {}
  export interface LosslessCompressionBatchItem extends RvImageOptimizeTypes.LosslessCompressionBatchItem {}
  export interface LosslessComparisonResult extends RvImageOptimizeTypes.LosslessComparisonResult {}
  export interface LosslessSuitabilityResult extends RvImageOptimizeTypes.LosslessSuitabilityResult {}
  export interface GPUSupportInfo extends RvImageOptimizeTypes.GPUSupportInfo {}

  export function validateImageFormat(file: File | Blob, options?: LosslessCompressOptions): Promise<ImageValidationFormatResult>;
  export function validateImageSize(file: File | Blob, options?: LosslessCompressOptions): ImageValidationSizeResult;
  export function validateImageFile(file: File | Blob, options?: LosslessCompressOptions): Promise<ImageValidationFileResult>;
  export function losslessCompress(
    imageSource: File | Blob | string | HTMLImageElement,
    options?: LosslessCompressOptions,
  ): Promise<LosslessCompressionResult>;
  export function losslessCompressBatch(
    imageSources: Array<File | Blob | string | HTMLImageElement>,
    options?: LosslessCompressOptions,
    concurrency?: number,
  ): Promise<LosslessCompressionBatchItem[]>;
  export function compareLosslessCompression(
    imageSource: File | Blob | string | HTMLImageElement,
    options?: LosslessCompressOptions,
  ): Promise<LosslessComparisonResult>;
  export function checkLosslessCompressionSuitability(
    imageSource: File | Blob | string | HTMLImageElement,
  ): Promise<LosslessSuitabilityResult>;
  export function downloadCompressedImage(
    compressedImage: LosslessCompressionResult | Blob | File,
    filename?: string | null,
  ): void;
  export function getGPUSupportInfo(): GPUSupportInfo;
}

declare module 'rv-image-optimize/node-compress' {
  export interface NodeCompressOptions extends RvImageOptimizeTypes.NodeCompressOptions {}
  export interface NodeCompressResult extends RvImageOptimizeTypes.NodeCompressResult {}
  export interface NodeDirectoryCompressItem extends RvImageOptimizeTypes.NodeDirectoryCompressItem {}
  export interface NodeDirectoryCompressResult extends RvImageOptimizeTypes.NodeDirectoryCompressResult {}

  export const NODE_COMPRESS_SUPPORTED_INPUT_FORMATS: string[];
  export const NODE_COMPRESS_OUTPUT_FORMATS: RvImageOptimizeTypes.OutputImageFormat[];
  export function isSupportedNodeImageFile(filePath: string): boolean;
  export function compressImageBuffer(inputBuffer: ArrayBuffer | Uint8Array, options?: NodeCompressOptions): Promise<NodeCompressResult>;
  export function compressImageFile(inputPath: string, options?: NodeCompressOptions): Promise<NodeCompressResult>;
  export function compressImageDirectory(inputDir: string, options?: NodeCompressOptions): Promise<NodeDirectoryCompressResult>;
}

declare module 'rv-image-optimize/LazyImage' {
  export type LazyImageProps = import('rv-image-optimize').LazyImageProps;
  const LazyImage: import('react').ComponentType<LazyImageProps>;
  export { LazyImage };
  export default LazyImage;
}

declare module 'rv-image-optimize/ProgressiveImage' {
  export type ProgressiveImageProps = import('rv-image-optimize').ProgressiveImageProps;
  const ProgressiveImage: import('react').ComponentType<ProgressiveImageProps>;
  export { ProgressiveImage };
  export default ProgressiveImage;
}

declare module 'rv-image-optimize/styles' {
  const stylesheetUrl: string;
  export default stylesheetUrl;
}
