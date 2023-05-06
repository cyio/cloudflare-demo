# Cloudflare Demo

## 测试 Worker 和 D1

```sh
wrangler init
wrangler d1 create demo_db

# 查看数据库信息，填写到 toml 文件
wrangler d1 list

# 设计表，并在本地创建
wrangler d1 execute demo_db --local --file=./schema.sql
# 验证，应输出 table
wrangler d1 execute demo_db --local --command='SELECT * FROM Comments'

# 开发 npm run dev
wrangler dev --local --persist

# 部署，去掉 local
wrangler d1 execute demo_db --file=./schema.sql
npx wrangler publish
```

