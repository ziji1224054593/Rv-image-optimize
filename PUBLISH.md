# 发布到 npm 指南

## 重要说明：发布哪些文件？

**不需要发布整个项目！** npm 包只会发布必要的文件，通过 `package.json` 中的 `files` 字段和 `.npmignore` 文件控制。

### 会被发布的文件：
- ✅ `dist/` - 构建后的文件（用户实际使用的文件）
- ✅ `src/` - 源代码（供用户按需导入）
- ✅ `lib/` - 工具库文件（imageOptimize.js、imageCache.js、losslessCompress.js）
- ✅ `*.md` - 文档文件（README.md、ProgressiveImage.md 等）
- ✅ `LICENSE` - 许可证文件

### 不会被发布的文件：
- ❌ `example/` - 开发示例（用户不需要）
- ❌ `node_modules/` - 依赖包（npm 会自动安装）
- ❌ `dist-static/` - 静态构建文件（开发用）
- ❌ `vite.config.js` - 构建配置（用户不需要）
- ❌ `package-lock.json` - 锁定文件（用户会自己生成）
- ❌ `.git/` - Git 仓库文件
- ❌ 其他开发工具配置文件

### 验证发布内容（发布前检查）

发布前可以使用以下命令查看哪些文件会被发布：

```bash
# 查看会被发布的文件列表
npm pack --dry-run

# 或者打包成 .tgz 文件查看（不会实际发布）
npm pack
```

这会创建一个 `.tgz` 文件，解压后可以看到实际发布的内容。

## 准备工作

1. 确保已安装所有依赖：
```bash
npm install
```

2. 构建项目：
```bash
npm run build
```

3. 检查构建结果：
```bash
ls -la dist/
```

应该看到以下文件：
- `image-optimize.es.js` (ES模块)
- `image-optimize.cjs.js` (CommonJS)
- `image-optimize.umd.js` (UMD)
- `style.css` (样式文件)

4. **验证发布内容**（重要）：
```bash
npm pack --dry-run
```

检查输出，确保只包含必要的文件。

## 发布步骤

### 1. 登录 npm（如果还没有登录）
```bash
npm login
```

### 2. 检查包信息
```bash
npm whoami
npm view rv-image-optimize
```

### 3. 发布到 npm
```bash
npm publish
```

注意：发布前会自动运行 `prepublishOnly` 脚本，自动构建项目。

### 4. 发布测试版本（可选）
```bash
npm publish --tag beta
```

### 5. 更新版本
```bash
# 更新补丁版本 (1.0.0 -> 1.0.1)
npm version patch

# 更新次要版本 (1.0.0 -> 1.1.0)
npm version minor

# 更新主版本 (1.0.0 -> 2.0.0)
npm version major
```
