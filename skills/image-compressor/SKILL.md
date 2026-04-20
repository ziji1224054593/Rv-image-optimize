---
name: image-compressor
description: 基于 `rv-image-optimize` 的图片压缩与格式转换 skill，支持 JPEG/PNG/WebP/AVIF、批量目录处理、尺寸限制与 JSON 结果汇总。Use when the user asks to compress images, reduce file size, convert to WebP or AVIF, batch-process image folders, resize images, or run image optimization from an agent workflow.
version: 3.0.20
metadata:
  openclaw:
    emoji: "\U0001F5BC\uFE0F"
    homepage: https://github.com/ziji1224054593/Rv-image-optimize
    requires:
      anyBins:
        - rv-image-optimize
        - npx
    install:
      - kind: node
        package: rv-image-optimize
        bins:
          - rv-image-optimize
---

# Image Compressor

基于 `rv-image-optimize` 的图片压缩与格式转换 skill。  
An image compression and format-conversion skill powered by `rv-image-optimize`.

## 核心功能 / Features

- 压缩单张或批量图片 / Compress single images or whole folders
- 转换 `jpeg`、`png`、`webp`、`avif` / Convert between `jpeg`, `png`, `webp`, and `avif`
- 压缩时限制尺寸 / Resize while compressing with max width and height
- 输出结构化 JSON 结果 / Return structured JSON summaries for agents
- 默认安全输出到新目录 / Default to safe output in a new directory

## 何时使用 / When to use

当用户提到以下需求时使用：

- “压缩图片”
- “图片太大”
- “减小文件大小”
- “转成 WebP / AVIF”
- “批量处理整个图片目录”
- “压缩时顺便缩小尺寸”
- “让 Agent / CLI 自动处理图片”

Use this skill when the user asks to:

- compress one or more images
- reduce image file size
- convert images to `webp` or `avif`
- batch-process an image folder
- resize images while compressing
- run image optimization from an agent or CLI workflow

## 默认策略 / Default behavior

除非用户明确要求修改原图，否则优先使用安全模式：

- 使用 `--output-dir` 输出到新目录
- 使用 `--json` 方便 Agent 汇总结果
- 默认不删除原图
- 默认不替换原图

Preferred command:

```bash
rv-image-optimize "{input}" --output-dir "{outputDir}" --format webp --quality 82 --json
```

如果全局命令不可用，可回退到：

```bash
npx rv-image-optimize "{input}" --output-dir "{outputDir}" --format webp --quality 82 --json
```

## 安全规则 / Safety rules

以下选项只有在用户明确要求时才允许使用：

- `--delete-original`
- `--replace-original`

`--replace-original` 不能和以下参数一起使用：

- `--output`
- `--output-dir`
- `--suffix`

If the user wants to preserve source files, always choose `--output-dir`.

## 常用命令 / Common recipes

### 单张图片压缩 / Compress a single image

```bash
rv-image-optimize "./photo.jpg" --output-dir "./compressed" --format webp --quality 82 --json
```

### 批量压缩目录 / Compress a folder

```bash
rv-image-optimize "./images" --output-dir "./images-compressed" --format webp --quality 82 --json
```

### 调整尺寸并压缩 / Resize and compress

```bash
rv-image-optimize "./images" --output-dir "./images-compressed" --format webp --quality 82 --max-width 1920 --max-height 1080 --json
```

### 压缩成功后删除原图 / Delete originals after success

```bash
rv-image-optimize "./images" --output-dir "./images-compressed" --format webp --quality 82 --delete-original --json
```

### 直接替换原图 / Replace originals in place

```bash
rv-image-optimize "./images" --format webp --quality 82 --replace-original --json
```

## 汇报结果 / Reporting results

使用 `--json` 时，建议汇总：

- `total`
- `success`
- `failed`
- 输出目录或是否替换了原图
- 失败文件列表

## 推荐参数 / Recommended defaults

- 默认格式：`webp`
- 默认质量：`82`
- 更小体积优先且接受更慢编码时：`avif`
- 如需更多示例和参数说明，见 [reference.md](reference.md)
