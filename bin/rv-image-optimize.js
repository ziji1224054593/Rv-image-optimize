#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import {
  compressImageDirectory,
  compressImageFile,
} from '../dist/node-compress.es.js';

function printHelp() {
  console.log(`
rv-image-optimize Node/CLI 压缩工具

用法:
  rv-image-optimize <input> [options]

参数:
  <input>                 图片文件路径，或包含图片的目录路径

选项:
  --output <file>         单文件模式下的精确输出文件路径
  --output-dir <dir>      输出目录
  --format <fmt>          输出格式: jpeg | png | webp | avif | auto
  --quality <1-100>       压缩质量，默认 80
  --max-width <number>    最大宽度
  --max-height <number>   最大高度
  --suffix <text>         输出文件后缀，默认 .compressed
  --overwrite             覆盖已存在输出文件
  --delete-original       压缩成功后删除原图
  --replace-original      压缩成功后用压缩结果替换原图
  --flatten               目录压缩时不保留目录结构
  --no-recursive          目录压缩时不递归子目录
  --concurrency <number>  目录压缩并发数，默认 4
  --json                  输出 JSON 结果
  --help                  显示帮助

示例:
  rv-image-optimize ./demo.jpg --format webp --quality 82
  rv-image-optimize ./demo.jpg --output ./dist/demo.webp --format webp
  rv-image-optimize ./images --output-dir ./compressed --format avif --quality 70
  rv-image-optimize ./images --format webp --replace-original
`);
}

function readOption(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  return args[index + 1];
}

function hasFlag(args, name) {
  return args.includes(name);
}

function printJson(payload) {
  console.log(JSON.stringify(payload, null, 2));
}

function sanitizeResultForJson(result) {
  return {
    ...result,
    buffer: result?.buffer ? `<Buffer ${result.buffer.length} bytes>` : undefined,
  };
}

function printFileSummary(result) {
  console.log(`输入文件: ${result.inputPath}`);
  console.log(`输出文件: ${result.outputPath}`);
  console.log(`格式: ${result.originalFormat || 'unknown'} -> ${result.compressedFormat}`);
  console.log(`尺寸: ${result.originalWidth || '?'} x ${result.originalHeight || '?'} -> ${result.compressedWidth || '?'} x ${result.compressedHeight || '?'}`);
  console.log(`大小: ${result.originalSizeFormatted || '未知'} -> ${result.compressedSizeFormatted}`);
  if (result.savedPercentage !== null) {
    console.log(`变化: ${result.savedPercentage > 0 ? '-' : '+'}${Math.abs(result.savedPercentage)}% (${result.savedSizeFormatted})`);
  }
  if (result.replacedOriginal) {
    console.log('原图处理: 已替换原图');
  } else if (result.originalDeleted) {
    console.log('原图处理: 已删除原图');
  }
}

function printDirectorySummary(result) {
  console.log(`输入目录: ${result.inputDir}`);
  console.log(`输出目录: ${result.outputDir}`);
  console.log(`总数: ${result.total}，成功: ${result.success}，失败: ${result.failed}`);

  result.items.forEach((item) => {
    if (item.success) {
      const action = item.result.replacedOriginal
        ? '，已替换原图'
        : item.result.originalDeleted
          ? '，已删除原图'
          : '';
      console.log(`✔ ${path.basename(item.inputPath)} -> ${item.result.compressedSizeFormatted}${action}`);
    } else {
      console.log(`✖ ${path.basename(item.inputPath)} -> ${item.error}`);
    }
  });
}

async function main() {
  const args = process.argv.slice(2);
  const input = args.find((arg) => !arg.startsWith('--'));

  if (!input || hasFlag(args, '--help')) {
    printHelp();
    process.exit(input ? 0 : 1);
  }

  const stats = await fs.stat(path.resolve(input));
  const format = readOption(args, '--format');
  const quality = readOption(args, '--quality');
  const maxWidth = readOption(args, '--max-width');
  const maxHeight = readOption(args, '--max-height');
  const suffix = readOption(args, '--suffix');
  const output = readOption(args, '--output');
  const outputDir = readOption(args, '--output-dir');
  const concurrency = readOption(args, '--concurrency');
  const asJson = hasFlag(args, '--json');
  const deleteOriginal = hasFlag(args, '--delete-original');
  const replaceOriginal = hasFlag(args, '--replace-original');

  if (deleteOriginal && replaceOriginal) {
    throw new Error('--delete-original 和 --replace-original 不能同时使用');
  }
  if (replaceOriginal && output) {
    throw new Error('--replace-original 模式下不能使用 --output');
  }
  if (replaceOriginal && outputDir) {
    throw new Error('--replace-original 模式下不能使用 --output-dir');
  }
  if (replaceOriginal && suffix) {
    throw new Error('--replace-original 模式下不能使用 --suffix');
  }

  const sharedOptions = {
    format: format === 'auto' ? null : format,
    quality: quality ? Number(quality) : 80,
    maxWidth: maxWidth ? Number(maxWidth) : null,
    maxHeight: maxHeight ? Number(maxHeight) : null,
    suffix: suffix || '.compressed',
    overwrite: hasFlag(args, '--overwrite'),
    recursive: !hasFlag(args, '--no-recursive'),
    preserveStructure: !hasFlag(args, '--flatten'),
    concurrency: concurrency ? Number(concurrency) : 4,
    outputDir,
    deleteOriginal,
    replaceOriginal,
  };

  if (stats.isFile()) {
    const result = await compressImageFile(input, {
      ...sharedOptions,
      outputPath: output,
    });

    if (asJson) {
      printJson(sanitizeResultForJson(result));
      return;
    }

    printFileSummary(result);
    return;
  }

  if (output) {
    throw new Error('目录模式不支持 --output，请改用 --output-dir');
  }

  const result = await compressImageDirectory(input, sharedOptions);
  if (asJson) {
    printJson({
      ...result,
      items: result.items.map((item) => (
        item.success
          ? { ...item, result: sanitizeResultForJson(item.result) }
          : item
      )),
    });
    return;
  }

  printDirectorySummary(result);
}

main().catch((error) => {
  console.error(`❌ ${error.message}`);
  process.exit(1);
});
