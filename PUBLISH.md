# 发布到 npm 指南

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
