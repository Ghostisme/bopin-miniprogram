# 播聘管理后台拆分说明

管理后台已迁移到上级目录的两个独立 Git 项目，本仓库不再维护后台源码：

- `D:\github_code\bopin-admin`：React 18 + Vite + TypeScript，默认端口 `5174`。
- `D:\github_code\bopin-admin-service`：Java 17 + Spring Boot 3，默认端口 `8080`。

两个项目各自拥有独立依赖、构建和 Git 生命周期。这里仅保留联调说明；详细启动说明请查看两个项目根目录的 README。

## 启动

```powershell
cd D:\github_code\bopin-admin
npm install
npm run dev
```

另开终端启动 Java 服务（首次启动会在 `bopin-admin-service/data/` 创建本地 H2 数据文件）：

```powershell
cd D:\github_code\bopin-admin-service
mvn spring-boot:run
```

前端开发代理会把 `/api` 请求转发到 `http://localhost:8080`。后台包含经营概览、通告审核、主播人才库、沟通运营、业务运营和系统设置；通告审核支持通过/下架，业务运营支持刷新和导出快照。合伙人提供的 V1-V4 时间线只作为业务实现参考，不作为后台菜单或页面。

## 功能实现参考（非后台模块）

Java 服务和小程序服务中心已覆盖合伙人时间线中的全部 12 项能力：主播注册与模卡、岗位发布与搜索、联系方式解锁、AI 话术与会员、平台结算与灵活用工、付费邀约、线上训练营与认证考试、线下培训、直播设备团购、年度主播盛典、多语言跨境结算、海外 EOR 对接。主播模卡为必填资料，未完成时后端会拦截联系方式解锁、沟通、培训报名、设备下单、活动报名和跨境结算等核心操作。

支付、AI、汇率和 EOR 当前使用可替换的本地沙箱适配器：会真实写入订单、余额、额度、报名、证书和处理状态，便于验收完整流程；上线时将适配器替换为正式服务即可。

## 访问地址

- 小程序 H5：`http://localhost:10086/`
- React 管理后台：`http://localhost:5174/`
- Java API：`http://localhost:8080/api/v1/`
