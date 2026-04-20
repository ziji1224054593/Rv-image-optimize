# Image Compressor Reference

这个 skill 封装的是已发布的 `rv-image-optimize` 包，内容尽量与项目 README 和 CLI 实际行为保持一致。  
This skill wraps the published `rv-image-optimize` package and stays aligned with the project README and CLI behavior.

## 安装方式 / Install options

### 安装 npm 包 / Install the package

```bash
npm install rv-image-optimize
```

### 无全局安装时运行 / Run without global install

```bash
npx rv-image-optimize ./images --output-dir ./compressed --format webp --quality 82 --json
```

## 推荐默认值 / Recommended defaults

- 输出格式 / Format: `webp`
- 压缩质量 / Quality: `82`
- 输出模式 / Output mode: `--output-dir`
- 结构化结果 / Structured result: `--json`
- 高风险参数 / Destructive flags: 默认关闭 / off by default

## 支持的输出格式 / Supported output formats

- `jpeg`
- `png`
- `webp`
- `avif`

## 常用 CLI 参数 / Useful CLI flags

- `--output <file>`: 单文件精确输出路径 / exact output path for a single file
- `--output-dir <dir>`: 输出到目标目录 / write results to a target directory
- `--format <fmt>`: 指定输出格式 / choose output format
- `--quality <1-100>`: 指定压缩质量 / set compression quality
- `--max-width <number>`: 限制最大宽度 / constrain width
- `--max-height <number>`: 限制最大高度 / constrain height
- `--suffix <text>`: 自定义输出后缀 / change output suffix
- `--overwrite`: 允许覆盖已存在文件 / allow overwriting existing output
- `--delete-original`: 成功后删除原图 / remove originals after successful output
- `--replace-original`: 成功后直接替换原图 / replace originals after successful output
- `--flatten`: 平铺目录输出 / flatten folder output
- `--no-recursive`: 关闭递归处理 / disable recursive folder traversal
- `--concurrency <number>`: 控制批量并发数 / control batch concurrency
- `--json`: 输出结构化摘要 / emit structured summary

## 选择建议 / Decision guide

### 保留原图 / Keep original files

推荐默认使用：

```bash
rv-image-optimize "{input}" --output-dir "{outputDir}" --format webp --quality 82 --json
```

### 原地替换 / Replace files in place

只有在用户明确同意时才使用：

```bash
rv-image-optimize "{input}" --format webp --quality 82 --replace-original --json
```

### 输出新文件后删除原图 / Delete originals after writing new files

只有在用户明确同意时才使用：

```bash
rv-image-optimize "{input}" --output-dir "{outputDir}" --format webp --quality 82 --delete-original --json
```

## Agent 汇总模板 / Agent summary template

向用户汇报时可使用以下结构：

```text
Processed: {total}
Succeeded: {success}
Failed: {failed}
Output: {outputDir or replaced originals}
Failed files:
- ...
```

## 相关文档 / Source docs

- 主说明 / Main package overview: `README.md`
- Agent 集成 / Agent guidance: `AGENT_INTEGRATION.md`
- CLI 细节 / CLI details: `NODE_CLI_COMPRESS.md`
