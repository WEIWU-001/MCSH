# MC服务器状态面板

一个基于 Node.js 的 Minecraft 服务器状态展示系统，联动 MC-API（https://github.com/WEIWU-001/MC-API） 实现服务器状态实时监控与可视化管理。

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

```
├── public/                    # 前端页面目录
│   ├── index.html            # 用户端：服务器列表展示页
│   └── admin.html            # 管理员端：服务器管理后台
├── data/                     # 数据存储目录
│   └── db.json              # 服务器信息存储文件
├── server.js                # 后端服务入口（接口 + 逻辑处理）
└── package.json             # 项目依赖与脚本配置
```

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

## MC 服务器管理系统 详细部署步骤
## 一、环境要求
 Node.js：版本 ≥ 14.0.0（推荐使用最新稳定版）

 管理器：npm（Node.js 自带）或 yarn

 Git：用于克隆项目（可选，也可直接下载源码）
## 二、部署步骤
### 步骤 1：获取项目代码
方式 A：Git 克隆（推荐）
```
git clone https://github.com/你的用户名/你的项目仓库.git
cd 你的项目仓库
```
方式 B：直接下载源码
从项目仓库下载源码压缩包，解压后进入项目目录。
### 步骤 2：安装项目依赖
在项目根目录执行以下命令安装依赖：
### 使用npm
```
npm install
```

### 或使用yarn

```
yarn install
```
### 步骤 3：配置关键信息
（1）配置邮箱（管理员验证码发送）
打开 server.js，找到 EMAIL_CONFIG 模块，替换为自己的邮箱配置：
```
const EMAIL_CONFIG = {
  host: 'smtp.example.com', // 例如：smtp.qq.com（QQ邮箱）、smtp.gmail.com（Gmail）
  port: 465, // 邮箱SMTP端口（一般为465/SSL或587/TLS）
  secure: true,
  auth: {
    user: '你的邮箱@example.com', // 替换为实际邮箱
    pass: '你的邮箱密码/授权码' // 替换为密码或应用专用授权码（如QQ邮箱需生成授权码）
  }
};
```
（2）配置服务端口（可选）
若需修改默认端口（默认8080），打开 server.js，修改 PORT 常量：
```
const PORT = 8080; // 可改为3000、5000等未占用端口
```
（3）配置 MC-API 对接
确保 public/index.html 和 public/admin.html 中调用 MC-API 的地址与你的 MC-API 服务地址一致（若同服务器部署，可保持默认）。
（4）配置社区链接
在index.html 第344行修改#的内容为你的社区
```
<a href="#" class="join-btn" id="joinButton" target="_blank" rel="noopener noreferrer">
        <i class="fas fa-users"></i> 立即加入社区
```

### 步骤 4：启动服务
开发模式（调试用，热重载）
```
npm run dev
#或 yarn dev
```

启动后访问：http://localhost:8080
生产模式（正式环境）
```
npm start
#或 yarn start
```
启动后访问：http://localhost:8080
## 步骤 5：访问系统
用户页面：http://localhost:8080/index.html（查看服务器列表）

管理员页面：http://localhost:8080/admin.html（验证码登录后管理服务器）

## 三、生产环境守护（可选）
推荐使用PM2保持服务长期运行：
全局安装 PM2：
```
npm install -g pm2
```

启动并守护服务：
```
pm2 start server.js --name mc-server-manager
```

查看状态 / 日志：
```
pm2 status
```
```
pm2 logs mc-server-manager
```

## 四、常见问题
邮箱验证码收不到？

检查 SMTP 配置、端口、账号密码 / 授权码是否正确，确保邮箱未限制第三方登录。

服务器状态不更新？

检查 MC-API 服务是否正常，对接地址是否配置正确。

端口被占用？

修改server.js中PORT常量，或停止占用该端口的其他程序。


### 版权说明
本项目采用 [MIT License](LICENSE) 开源，使用或二次分发时遵守协议条款即可，无需强制标注原项目地址。
项目部分代码经 AI 生成并完成独创性修改，符合开源协议要求。
