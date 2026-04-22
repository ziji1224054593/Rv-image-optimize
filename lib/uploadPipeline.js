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
  };
}

function buildUploadFailure(error) {
  return {
    message: error?.message || '上传失败',
    response: error?.response || null,
  };
}

export async function compressAndUploadFiles(files, compressOptions = {}, uploadConfig = {}, runtimeOptions = {}) {
  const normalizedFiles = Array.from(files || []);
  const { concurrency, onProgress } = normalizeRuntimeOptions(runtimeOptions);
  const results = new Array(normalizedFiles.length);
  const queue = normalizedFiles.map((file, index) => ({ file, index }));
  let completed = 0;

  const worker = async () => {
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;

      try {
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

        const uploadResult = await uploadFileWithConfig(
          compressionResult.file,
          compressionResult,
          uploadConfig
        );

        results[current.index] = {
          sourceFile: current.file,
          success: true,
          compressionResult,
          uploadResult,
        };
      } catch (error) {
        results[current.index] = {
          sourceFile: current.file,
          success: false,
          error: buildUploadFailure(error),
        };
      } finally {
        completed += 1;
        if (onProgress) {
          onProgress({
            completed,
            total: normalizedFiles.length,
            currentIndex: current.index,
            result: results[current.index],
          });
        }
      }
    }
  };

  await Promise.all(
    Array(Math.min(concurrency, normalizedFiles.length))
      .fill(null)
      .map(() => worker())
  );

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
