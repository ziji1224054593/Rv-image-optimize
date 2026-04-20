# Agent / CLI 集成说明

`rv-image-optimize` 可以作为标准 CLI 工具被各类 Agent 调用，包括：

- `Cursor`
- `Claude Code`
- 其他支持 shell / terminal 执行的编码 Agent
- skills 驱动的平台型 Agent

## 适用前提

只要 Agent 具备以下任一能力，就可以接入：

- 能直接执行终端命令
- 能通过 skill / tool 指令间接执行终端命令

推荐统一使用 CLI，而不是让 Agent 临时手写 Node 脚本，因为 CLI 的输入、输出和副作用都更稳定。

## 推荐调用方式

### 方式 1：仓库内直接调用

```bash
node ./bin/rv-image-optimize.js ./images --output-dir ./compressed --format webp --quality 82 --json
```

### 方式 2：包已安装时通过 `npx`

```bash
npx rv-image-optimize ./images --output-dir ./compressed --format webp --quality 82 --json
```

### 方式 3：全局安装后直接调用

```bash
rv-image-optimize ./images --output-dir ./compressed --format webp --quality 82 --json
```

### 方式 4：直接执行上传子命令

```bash
rv-image-optimize upload ./compressed/demo.webp --url https://example.com/admin/upload --json
```

### 方式 5：一体化压缩后上传

```bash
rv-image-optimize pipeline ./assets/images --format webp --quality 82 --config ./upload.config.json --json
```

## 为什么推荐加 `--json`

对 Agent 来说，`--json` 更适合自动处理结果，因为可以直接解析：

- `total`
- `success`
- `failed`
- `items`
- `outputPath`
- `savedPercentage`

这样 Agent 可以更可靠地总结结果，而不是依赖自然语言日志。

## 给 Cursor / Claude Code 的用法

### 安全模式：输出到新目录

```bash
npx rv-image-optimize ./assets/images --output-dir ./assets/images-compressed --format webp --quality 82 --json
```

### 压缩成功后删除原图

```bash
npx rv-image-optimize ./assets/images --output-dir ./assets/images-compressed --format webp --quality 82 --delete-original --json
```

### 直接替换原图

```bash
npx rv-image-optimize ./assets/images --format webp --quality 82 --replace-original --json
```

### 上传单个文件

```bash
npx rv-image-optimize upload ./assets/images/demo.webp --url https://example.com/admin/upload --json
```

### 通过配置文件批量上传

```bash
npx rv-image-optimize upload ./assets/images-compressed --config ./upload.config.json --json
```

### 仅预览上传字段

```bash
npx rv-image-optimize upload ./assets/images/demo.webp --config ./upload.config.json --preview-only --json
```

### 压缩后直接上传

```bash
npx rv-image-optimize pipeline ./assets/images --format webp --quality 82 --config ./upload.config.json --json
```

### 推荐提示词

```text
请使用 rv-image-optimize CLI 压缩 ./assets/images 目录中的图片：
- 输出格式 webp
- 质量 82
- 输出到 ./assets/images-compressed
- 使用 JSON 输出
- 最后汇总成功数、失败数和输出目录
```

```text
请使用 rv-image-optimize CLI 处理 ./public/uploads 中的图片：
- 直接替换原图
- 使用 --replace-original
- 使用 JSON 输出
- 如果有失败项，请列出失败文件，不要继续做额外修改
```

## 给 skills 型 Agent 的建议

如果你的 Agent 平台依赖 `skills`，建议把这个工具包装成一个“图片压缩 skill”，明确告诉模型：

- 默认用 `rv-image-optimize`
- 默认加 `--json`
- 默认不要删除或替换原图
- 只有用户明确要求时才允许 `--delete-original` 或 `--replace-original`

## 推荐 skill 规则

```md
当用户要求批量压缩图片时，优先使用 `rv-image-optimize` CLI。

默认策略：
- 使用 `--output-dir`
- 使用 `--json`
- 不删除原图
- 不替换原图
- 如果要调上传接口，优先用 `rv-image-optimize upload`
- 如果要一条命令完成压缩后上传，优先用 `rv-image-optimize pipeline`
- 复杂上传字段优先放到 `--config` JSON 文件
- 推荐在配置文件里显式写 `authorization` / `cookie` / `contentType`

如果用户明确要求“压缩后删除原图”：
- 使用 `--delete-original`

如果用户明确要求“直接替换原图”：
- 使用 `--replace-original`

禁止组合：
- `--replace-original` 与 `--output`
- `--replace-original` 与 `--output-dir`
- `--replace-original` 与 `--suffix`

执行后读取 JSON 输出，向用户汇报：
- total
- success
- failed
- 输出目录或替换结果
- 失败文件列表
- 上传场景下的 HTTP 状态码和失败响应
```

## 推荐命令模板

### 安全模式

```bash
rv-image-optimize "{input}" --output-dir "{outputDir}" --format webp --quality 82 --json
```

### 删除原图模式

```bash
rv-image-optimize "{input}" --output-dir "{outputDir}" --format webp --quality 82 --delete-original --json
```

### 替换原图模式

```bash
rv-image-optimize "{input}" --format webp --quality 82 --replace-original --json
```

### 上传模式

```bash
rv-image-optimize upload "{input}" --config "{configPath}" --json
```

### 一体化压缩上传模式

```bash
rv-image-optimize pipeline "{input}" --format webp --quality 82 --config "{configPath}" --json
```

## 默认安全约定

建议你给所有 Agent 统一约束为：

- 默认输出到新目录，不动原图
- 默认总是加 `--json`
- `--delete-original` 需要用户明确确认
- `--replace-original` 需要用户明确确认
- 失败项必须单独汇报
- 上传请求的复杂字段优先写进配置文件，不要在提示词里拼接超长 JSON
- 如果接口文档包含 `Authorization`、`Cookie`、`Content-Type`，优先写进配置文件的显式字段，而不是完全依赖通用 `headers`

## 常见集成场景

### 场景 1：PR 前自动压缩仓库素材

```bash
rv-image-optimize ./public/images --output-dir ./public/images-compressed --format webp --quality 82 --json
```

### 场景 2：CMS 导出图片的批处理压缩

```bash
rv-image-optimize ./exports/images --output-dir ./exports/images-webp --format webp --quality 80 --json
```

### 场景 3：AI Agent 执行后汇报摘要

Agent 可以从 JSON 中汇总：

- 共处理多少张
- 成功多少张
- 失败多少张
- 输出到了哪里
- 是否删除/替换了原图

### 场景 4：AI Agent 执行上传接口

```bash
rv-image-optimize upload ./exports/images-webp --config ./upload.config.json --json
```

### 场景 5：AI Agent 压缩后直接上传

```bash
rv-image-optimize pipeline ./exports/images --format webp --quality 82 --config ./upload.config.json --json
```

## 注意事项

- `--replace-original` 是高风险动作，建议只在用户明确授权时执行
- 如果需要上传链路联动，优先直接使用 `rv-image-optimize upload`；只有在你需要自定义脚本控制时再直接调用 `rv-image-optimize/upload-core`
- 浏览器环境不要调用这个 CLI 或 `node-compress` 子入口
