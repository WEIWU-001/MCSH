# MC服务器管理系统

一个基于 Node.js 的 Minecraft 服务器管理与展示系统，联动 MC-API（https://github.com/WEIWU-001/MC-API） 实现服务器状态实时监控与可视化管理。

## 核心功能
- 📋 前端展示：服务器列表、在线状态、玩家数量、版本信息
- 🔧 管理员后台：验证码登录，支持服务器增删改查
- 📞 联系方式：自动识别 QQ、微信、网站等，展示对应图标
- 🔄 状态刷新：定时同步服务器在线状态
- 🔐 安全验证：邮箱验证码登录，保护管理权限

## 技术栈
- 后端：Node.js + Express
- 前端：HTML + CSS + JavaScript
- 数据存储：JSON 文件（data/db.json）
- 依赖：cors、node-fetch、nodemailer、nodemon 等

## 文件结构
├── public/ # 前端页面目录
│ ├── index.html # 用户端：服务器列表展示页
│ └── admin.html # 管理员端：服务器管理后台
├── data/ # 数据存储目录
│ └── db.json # 服务器信息存储文件
├── server.js # 后端服务入口（接口 + 逻辑处理）
└── package.json # 项目依赖与脚本配置

## 快速使用
1. 克隆项目并进入目录
2. 安装依赖：`npm install`
3. 配置邮箱（server.js 中 EMAIL_CONFIG，用于管理员验证码）
4. 启动服务：
   - 生产模式：`npm start`
   - 开发模式（热重载）：`npm run dev`
5. 访问地址：
   - 用户页：http://localhost:8080/index.html
   - 管理页：http://localhost:8080/admin.html

## 关键说明
- 服务器状态通过 MC-API 实时查询，需确保 API 地址配置正确
- 管理员验证码有效期 10 分钟，支持 5 次验证尝试
- 数据存储在 data/db.json，无需额外数据库
- 支持自定义服务端口（修改 server.js 中 PORT 常量）
