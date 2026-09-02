# bopin-miniprogram

播聘小程序（Taro + React），当前仓库只维护小程序端代码。

## 关联项目

- `D:\github_code\bopin-admin`：React 18 + Vite 管理后台，默认 `5174`
- `D:\github_code\bopin-admin-service`：Java 17 + Spring Boot API，默认 `8080`

后台已经从本仓库拆出，两个目录各自拥有独立 Git 仓库、依赖和构建流程。

## 小程序启动

```powershell
npm install
npm run dev:h5
```

H5 默认访问 `http://localhost:10086/`。小程序请求默认连接 `http://localhost:8080/api/v1`。
