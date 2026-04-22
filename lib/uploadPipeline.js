import { losslessCompress } from './losslessCompress.js';
import {
  UPLOAD_VALUE_TYPES,
  UPLOAD_PLACEHOLDERS,
  normalizeUploadConfig,
  buildUploadContext,
  buildUploadRequestHeaders,
  buildUploadFormData,
  createUploadPayloadPreview,
  uploadFileWithConfig,
  uploadCompressedFile,
} from './uploadCore.js';

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
};

function normalizeRuntimeOptions(runtimeOptions = {}) {
  return {
    concurrency: Math.max(1, Number(runtimeOptions.concurrency) || 2),
    onProgress: typeof runtimeOptions.onProgress === 'function' ? runtimeOptions.onProgress : null,
    onCompressionComplete: typeof runtimeOptions.onCompressionComplete === 'function'
      ? runtimeOptions.onCompressionComplete
      : null,
    onUploadStart: typeof runtimeOptions.onUploadStart === 'function'
      ? runtimeOptions.onUploadStart
      : null,
    onUploadComplete: typeof runtimeOptions.onUploadComplete === 'function'
      ? runtimeOptions.onUploadComplete
      : null,
  };
}

function buildUploadFailure(error) {
  return {
    message: error?.message || '上传失败',
    response: error?.response || null,
  };
}

function invokeSafeCallback(callback, payload, label) {
  if (typeof callback !== 'function') {
    return;
  }

  try {
    const result = callback(payload);
    if (result && typeof result.then === 'function') {
      result.catch((error) => {
        console.warn(`[uploadPipeline] ${label} 回调执行失败:`, error);
      });
    }
  } catch (error) {
    console.warn(`[uploadPipeline] ${label} 回调执行失败:`, error);
  }
}

export async function compressAndUploadFiles(files, compressOptions = {}, uploadConfig = {}, runtimeOptions = {}) {
  const normalizedFiles = Array.from(files || []);
  const {
    concurrency,
    onProgress,
    onCompressionComplete,
    onUploadStart,
    onUploadComplete,
  } = normalizeRuntimeOptions(runtimeOptions);
  const results = new Array(normalizedFiles.length);
  const queue = normalizedFiles.map((file, index) => ({ file, index }));
  let completed = 0;

  const worker = async () => {
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;

      try {
        const compressionStartedAt = Date.now();
        const compressionResult = await losslessCompress(current.file, compressOptions);
        Object.assign(compressionResult, buildUploadContext(compressionResult.file, {
          sourceFileName: current.file.name,
          sourceFileSize: current.file.size,
          compressedFileName: compressionResult.compressedFileName,
          compressedSize: compressionResult.compressedSize,
          savedSize: compressionResult.savedSize,
          savedPercentage: compressionResult.savedPercentage,
        }));
        compressionResult.sourceFile = current.file;
        compressionResult.sourceFileName = current.file.name;
        compressionResult.sourceFileSize = current.file.size;
        compressionResult.compressionDurationMs = Date.now() - compressionStartedAt;

        if (onCompressionComplete) {
          invokeSafeCallback(onCompressionComplete, {
            index: current.index,
            file: current.file,
            compressionResult,
          }, 'onCompressionComplete');
        }

        if (onUploadStart) {
          invokeSafeCallback(onUploadStart, {
            index: current.index,
            file: current.file,
            compressionResult,
          }, 'onUploadStart');
        }

        const uploadStartedAt = Date.now();
        const uploadResult = await uploadFileWithConfig(
          compressionResult.file,
          compressionResult,
          uploadConfig
        );
        uploadResult.uploadDurationMs = Date.now() - uploadStartedAt;

        results[current.index] = {
          sourceFile: current.file,
          success: true,
          compressionResult,
          uploadResult,
        };

        if (onUploadComplete) {
          invokeSafeCallback(onUploadComplete, {
            index: current.index,
            file: current.file,
            compressionResult,
            uploadResult,
            success: true,
          }, 'onUploadComplete');
        }
      } catch (error) {
        results[current.index] = {
          sourceFile: current.file,
          success: false,
          error: buildUploadFailure(error),
        };

        if (onUploadComplete) {
          invokeSafeCallback(onUploadComplete, {
            index: current.index,
            file: current.file,
            error: results[current.index].error,
            success: false,
          }, 'onUploadComplete');
        }
      } finally {
        completed += 1;
        if (onProgress) {
          invokeSafeCallback(onProgress, {
            completed,
            total: normalizedFiles.length,
            currentIndex: current.index,
            result: results[current.index],
          }, 'onProgress');
        }
      }
    }
  };

  await Promise.all(
    Array(Math.min(concurrency, normalizedFiles.length))
      .fill(null)
      .map(() => worker())
  );

  const failures = results
    .map((result, index) => ({ result, index }))
    .filter(({ result }) => result && !result.success)
    .map(({ result, index }) => ({
      index,
      fileName: result.sourceFile?.name || '',
      error: result.error,
    }));

  results.summary = {
    total: normalizedFiles.length,
    success: results.filter((item) => item?.success).length,
    failed: failures.length,
    failures,
  };

  return results;
}

export default {
  UPLOAD_VALUE_TYPES,
  UPLOAD_PLACEHOLDERS,
  normalizeUploadConfig,
  buildUploadRequestHeaders,
  buildUploadFormData,
  createUploadPayloadPreview,
  uploadFileWithConfig,
  uploadCompressedFile,
  compressAndUploadFiles,
};
