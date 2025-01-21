# 落地生根服务

提供所有服务，并由服务提供能力。无论是开源，还是由平台提供服务，运行时均使用相同的服务。

### 服务说明

- `HANDLER`类型服务中，只存储原始代码、环境变量和所需依赖。本模块只作运行时，构建应在运行时内处理。

- `HTTP`类型服务中，从`res.locals.context`取上下文。

```sh
pnpm un --filter @ldsgy/storage-service @ldsg/app @ldsg/common @ldsg/core @ldsg/services && pnpm i --filter @ldsgy/storage-service @ldsg/app @ldsg/common @ldsg/core @ldsg/services
```
