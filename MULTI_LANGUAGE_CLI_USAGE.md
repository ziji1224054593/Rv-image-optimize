# 多语言通过 CLI 调用说明

本文档说明如何在 `Java`、`Python`、`PHP` 等后端环境中，通过 `rv-image-optimize` 的 CLI 复用图片压缩能力。

## 适用场景

适合以下场景：

- Java 服务调用图片压缩
- Python 脚本或后端任务批量处理图片
- PHP 后台在上传后调用压缩流程
- 多语言系统统一复用同一套图片处理逻辑

如果你只是想在 Node 环境里直接调用 API，请查看 [NODE_CLI_COMPRESS.md](./NODE_CLI_COMPRESS.md)。

## 推荐调用方式

推荐统一通过 CLI 调用，而不是让各语言临时重写压缩逻辑。

建议默认命令：

```bash
rv-image-optimize "D:/images" --output-dir "D:/images-compressed" --format webp --quality 82 --json
```

如果没有全局安装，也可以使用：

```bash
npx rv-image-optimize "D:/images" --output-dir "D:/images-compressed" --format webp --quality 82 --json
```

## 为什么推荐 `--json`

对多语言后端来说，`--json` 更适合程序解析，常见会用到这些字段：

- `total`
- `success`
- `failed`
- `items`
- `outputPath`
- `compressedSizeFormatted`
- `savedPercentage`

## 通用接入建议

- 优先使用绝对路径
- 默认输出到新目录，不要默认替换原图
- 只有用户明确要求时才使用 `--delete-original` 或 `--replace-original`
- 统一处理非 `0` 退出码
- 统一处理超时和 JSON 解析失败

## Java 示例

```java
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

public class ImageOptimizeCliExample {
    public static void main(String[] args) throws Exception {
        String inputPath = "D:/images";
        String outputDir = "D:/images-compressed";

        List<String> command = new ArrayList<>();
        command.add("npx");
        command.add("rv-image-optimize");
        command.add(inputPath);
        command.add("--output-dir");
        command.add(outputDir);
        command.add("--format");
        command.add("webp");
        command.add("--quality");
        command.add("82");
        command.add("--json");

        ProcessBuilder pb = new ProcessBuilder(command);
        pb.redirectErrorStream(true);

        Process process = pb.start();

        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
        }

        int exitCode = process.waitFor();

        System.out.println("Exit code: " + exitCode);
        System.out.println(output);

        if (exitCode != 0) {
            throw new RuntimeException("图片压缩失败");
        }
    }
}
```

## Python 示例

```python
import json
import subprocess

input_path = r"D:\images"
output_dir = r"D:\images-compressed"

cmd = [
    "npx",
    "rv-image-optimize",
    input_path,
    "--output-dir", output_dir,
    "--format", "webp",
    "--quality", "82",
    "--json",
]

result = subprocess.run(
    cmd,
    capture_output=True,
    text=True,
    encoding="utf-8"
)

print("exit code:", result.returncode)
print("stdout:", result.stdout)
print("stderr:", result.stderr)

if result.returncode != 0:
    raise RuntimeError("图片压缩失败")

data = json.loads(result.stdout)
print("total:", data.get("total"))
print("success:", data.get("success"))
print("failed:", data.get("failed"))
```

## PHP 示例

```php
<?php

$inputPath = 'D:/images';
$outputDir = 'D:/images-compressed';

$command = [
    'npx',
    'rv-image-optimize',
    $inputPath,
    '--output-dir',
    $outputDir,
    '--format',
    'webp',
    '--quality',
    '82',
    '--json'
];

$descriptorspec = [
    0 => ['pipe', 'r'],
    1 => ['pipe', 'w'],
    2 => ['pipe', 'w'],
];

$process = proc_open($command, $descriptorspec, $pipes);

if (!is_resource($process)) {
    throw new RuntimeException('无法启动 rv-image-optimize CLI');
}

fclose($pipes[0]);

$stdout = stream_get_contents($pipes[1]);
fclose($pipes[1]);

$stderr = stream_get_contents($pipes[2]);
fclose($pipes[2]);

$exitCode = proc_close($process);

echo "exit code: " . $exitCode . PHP_EOL;
echo "stdout: " . $stdout . PHP_EOL;
echo "stderr: " . $stderr . PHP_EOL;

if ($exitCode !== 0) {
    throw new RuntimeException('图片压缩失败');
}

$data = json_decode($stdout, true, 512, JSON_THROW_ON_ERROR);

echo "total: " . ($data['total'] ?? 0) . PHP_EOL;
echo "success: " . ($data['success'] ?? 0) . PHP_EOL;
echo "failed: " . ($data['failed'] ?? 0) . PHP_EOL;
```

## 推荐默认策略

建议多语言统一采用如下策略：

- 默认使用 `--output-dir`
- 默认使用 `--json`
- 默认不删除原图
- 默认不替换原图

推荐命令模板：

```bash
npx rv-image-optimize "{input}" --output-dir "{outputDir}" --format webp --quality 82 --json
```

## 何时考虑服务化

如果后续不仅是 Java / Python / PHP 偶尔调用，而是：

- 多个系统高频调用
- 需要统一权限 / 日志 / 限流
- 需要远程接口而不是本机进程调用

那就更适合进一步封装为独立的 Node 图片压缩服务，而不是继续只靠 CLI 进程调用。
