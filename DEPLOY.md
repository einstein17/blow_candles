# 部署指南 (Deployment Guide)

## 1. 项目简介

本项目是一个基于 Web 的静态网页应用，模拟吹蜡烛的交互体验。项目包含构建脚本，用于优化资源和生成最终的生产环境代码。

## 2. 前置要求

在开始构建之前，请确保您的开发环境已安装以下工具：

- **Node.js**: 用于运行构建脚本和管理依赖。建议使用 LTS 版本。

## 3. 构建步骤

1.  **安装依赖**
    在项目根目录下运行以下命令安装所需的 npm 包：

    ```bash
    npm install
    ```

2.  **构建项目**
    运行构建命令以生成生产环境代码：

    ```bash
    npm run build
    ```

3.  **构建产物**
    构建完成后，生成的静态文件将位于 `dist` 目录中。该目录包含了所有部署所需的 HTML、CSS 和 JavaScript 文件。

## 4. 部署方案一：静态托管服务 (推荐)

推荐使用现代静态网站托管服务，它们通常提供自动化的 CI/CD 流程和全球 CDN 加速。

### 推荐平台

- **Vercel**
- **Netlify**
- **GitHub Pages**

### 配置要点

在配置项目时，请使用以下设置：

- **Build Command (构建命令)**: `npm run build`
- **Output Directory (输出目录)**: `dist`

## 5. 部署方案二：自建服务器 (Nginx)

如果您选择使用自建服务器（如 VPS），可以使用 Nginx 来托管静态文件。

### 步骤

1.  在本地执行构建步骤，生成 `dist` 目录。
2.  将 `dist` 目录中的所有文件上传到服务器的 Web 根目录（例如 `/var/www/blow_candles`）。
3.  配置 Nginx。

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com; # 替换为您的域名

    root /var/www/blow_candles; # 替换为实际上传路径
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 可选：启用 Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```
