# bopin-miniprogram

播聘小程序（Taro + React），当前仓库只维护小程序端代码。运行时 `USE_MOCK=false`，业务数据通过 Java 服务的真实 HTTP 接口读取和写入；本地 mock 分支只保留给离线页面回归，默认不会执行。

## 关联项目

- `D:\github_code\bopin-admin`：React 18 + Vite 管理后台，默认 `5174`
- `D:\github_code\bopin-admin-service`：Java 17 + Spring Boot API，默认 `8080`

后台已经从本仓库拆出，两个目录各自拥有独立 Git 仓库、依赖和构建流程。

## 小程序启动

```powershell
npm install
npm run dev:h5
```

H5 默认访问 `http://localhost:10086/`。小程序请求默认连接 `http://localhost:8080/api/v1`，需要先启动 `bopin-admin-service`。

## API 地址

开发者工具本机调试可直接使用 localhost。真机调试和上线时不能把 localhost 配进小程序，请在构建前指定已备案的 HTTPS 域名：

```powershell
$env:TARO_APP_API_BASE_URL = "https://api.example.com/api/v1"
npm run build:weapp
```

生成目录为 `dist/`，微信开发者工具应选择本仓库下的 `dist/`（其中包含 `app.json`）。
