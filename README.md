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

### 手机查看本地 H5

Java 服务和 H5 都运行在电脑上，手机只需要和电脑连接同一个 Wi-Fi。电脑当前局域网地址可在 Windows 网络设置中查看，例如 `192.168.1.5`。分别启动：

```powershell
# 在 bopin-admin-service 目录
$env:SPRING_PROFILES_ACTIVE = "mysql"
$env:MYSQL_USERNAME = "root"
$env:MYSQL_PASSWORD = "123456"
$env:MYSQL_INIT_MODE = "always"
$env:MYSQL_DATA_LOCATIONS = "classpath:data-mysql.sql"
$env:SERVER_ADDRESS = "0.0.0.0"
mvn spring-boot:run

# 在 bopin-miniprogram 目录
npm run dev:h5:phone
```

然后在手机浏览器打开电脑 IP 加 H5 端口：

```text
http://192.168.1.5:10086
```

不要在手机上打开 `localhost`，因为手机的 `localhost` 指向手机自己，不是电脑。Java API 会通过 H5 开发代理转发到电脑的 `localhost:8080`，所以手机网页不需要直接访问 Java 端口。

岗位通告列表使用 Java 服务的分页接口 `GET /api/v1/notices?page=1&pageSize=20`；页面通过 `fetchNoticesPage` 读取当前页，旧页面调用 `fetchNotices` 时仍会自动解包 `items`，不会再一次性加载整张岗位表。登录/注册返回的 JWT 会按当前身份保存在本地，后续需要登录的请求自动发送 `Authorization: Bearer <token>`。

## API 地址

开发者工具本机调试可直接使用 localhost。真机调试和上线时不能把 localhost 配进小程序，请在构建前指定已备案的 HTTPS 域名：

```powershell
$env:TARO_APP_API_BASE_URL = "https://api.example.com/api/v1"
npm run build:weapp
```

生成目录为 `dist/`，微信开发者工具应选择本仓库下的 `dist/`（其中包含 `app.json`）。
