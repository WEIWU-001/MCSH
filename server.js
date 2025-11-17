const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');
const app = express();

// 替换为通用端口（8080为常见开发端口）
const PORT = 8080;
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

// 邮箱配置 - 替换为占位符，用户需自行填写
const EMAIL_CONFIG = {
  host: 'smtp.example.com', // 例如：smtp.qq.com、smtp.gmail.com
  port: 465,
  secure: true,
  auth: {
    user: 'your-email@example.com', // 替换为实际邮箱
    pass: 'your-email-password-or-app-code' // 替换为实际密码/授权码
  }
};

// 接收验证码的邮箱 - 替换为占位符
const ADMIN_EMAIL = 'admin@example.com'; // 替换为实际接收邮箱

// 验证码存储（内存中，重启会丢失）
const verificationCodes = new Map();

// 创建邮件传输器
const emailTransporter = nodemailer.createTransport(EMAIL_CONFIG);

// 生成随机验证码
function generateVerificationCode() {
  return Math.random().toString().slice(2, 8); // 6位数字验证码
}

// 发送验证码邮件到指定邮箱
async function sendVerificationCode() {
  try {
    const code = generateVerificationCode();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10分钟有效期

    // 存储验证码（使用固定标识）
    verificationCodes.set('admin', {
      code,
      expiresAt,
      attempts: 0 // 尝试次数
    });

    const mailOptions = {
      from: EMAIL_CONFIG.auth.user,
      to: ADMIN_EMAIL,
      subject: 'Minecraft服务器管理后台验证码',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a6cf7;">Minecraft服务器管理后台</h2>
          <p>您的登录验证码为：</p>
          <div style="background: #f8fafc; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #4a6cf7; font-size: 32px; margin: 0; letter-spacing: 5px;">${code}</h1>
          </div>
          <p>验证码有效期10分钟，请尽快使用。</p>
          <p style="color: #94a3b8; font-size: 12px;">如果这不是您的操作，请忽略此邮件。</p>
        </div>
      `
    };

    await emailTransporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('发送邮件失败:', error);
    return false;
  }
}

// 确保数据目录和数据库文件存在
async function initializeDatabase() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    try {
      await fs.access(DB_PATH);
    } catch {
      await fs.writeFile(DB_PATH, JSON.stringify({ servers: [] }), 'utf8');
      console.log('✅ 数据库文件已初始化');
    }
    
    console.log('📁 数据库初始化完成');
  } catch (err) {
    console.error('❌ 数据库初始化失败:', err);
  }
}

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 数据清洗函数
function cleanString(str) {
  if (typeof str !== 'string') str = String(str || '');
  return str.trim();
}

// 读取数据库
async function readDB() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(data) || { servers: [] };
  } catch (err) {
    console.error('❌ 数据库读取失败:', err);
    return { servers: [] };
  }
}

// 写入数据库
async function writeDB(data) {
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(data || { servers: [] }, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('❌ 写入数据库失败:', err);
    return false;
  }
}

// 1. 获取所有服务器
app.get('/api/servers', async (req, res) => {
  try {
    const db = await readDB();
    const servers = Array.isArray(db.servers) ? db.servers : [];
    
    res.json({
      success: true,
      data: servers
    });
  } catch (err) {
    console.error('❌ 获取服务器列表失败:', err);
    res.status(500).json({
      success: false,
      error: '获取服务器列表失败'
    });
  }
});

// 2. 添加服务器
app.post('/api/servers', async (req, res) => {
  try {
    const { name, host, port = 25565, description, contact } = req.body;
    
    if (!name || !host) {
      return res.status(400).json({
        success: false,
        error: '服务器名称和地址不能为空'
      });
    }

    const db = await readDB();
    const newServer = {
      id: Date.now().toString(),
      name: cleanString(name),
      host: cleanString(host),
      port: parseInt(port) || 25565,
      description: cleanString(description || ''),
      contact: cleanString(contact || ''),
      createdAt: new Date().toISOString()
    };

    db.servers.push(newServer);
    const writeSuccess = await writeDB(db);

    if (writeSuccess) {
      res.status(201).json({
        success: true,
        data: newServer
      });
    } else {
      res.status(500).json({
        success: false,
        error: '保存服务器失败'
      });
    }
  } catch (err) {
    console.error('❌ 添加服务器失败:', err);
    res.status(500).json({
      success: false,
      error: '添加服务器失败'
    });
  }
});

// 3. 更新服务器
app.put('/api/servers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, host, port, description, contact } = req.body;

    const db = await readDB();
    const serverIndex = db.servers.findIndex(s => s.id === id);

    if (serverIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '服务器不存在'
      });
    }

    if (name) db.servers[serverIndex].name = cleanString(name);
    if (host) db.servers[serverIndex].host = cleanString(host);
    if (port) db.servers[serverIndex].port = parseInt(port) || 25565;
    if (description !== undefined) db.servers[serverIndex].description = cleanString(description);
    if (contact !== undefined) db.servers[serverIndex].contact = cleanString(contact);
    db.servers[serverIndex].updatedAt = new Date().toISOString();

    const writeSuccess = await writeDB(db);
    if (writeSuccess) {
      res.json({
        success: true,
        data: db.servers[serverIndex]
      });
    } else {
      res.status(500).json({
        success: false,
        error: '更新服务器失败'
      });
    }
  } catch (err) {
    console.error('❌ 更新服务器失败:', err);
    res.status(500).json({
      success: false,
      error: '更新服务器失败'
    });
  }
});

// 4. 删除服务器
app.delete('/api/servers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const initialLength = db.servers.length;

    db.servers = db.servers.filter(server => server.id !== id);

    if (db.servers.length === initialLength) {
      return res.status(404).json({
        success: false,
        error: '服务器不存在'
      });
    }

    const writeSuccess = await writeDB(db);
    if (writeSuccess) {
      res.json({
        success: true,
        message: '服务器删除成功'
      });
    } else {
      res.status(500).json({
        success: false,
        error: '删除服务器失败'
      });
    }
  } catch (err) {
    console.error('❌ 删除服务器失败:', err);
    res.status(500).json({
      success: false,
      error: '删除服务器失败'
    });
  }
});

// 5. 获取服务器状态（使用占位符API配置）
app.get('/api/servers/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📡 查询服务器状态 ID: ${id}`);

    const db = await readDB();
    const server = db.servers.find(s => s.id === id);

    if (!server) {
      return res.status(404).json({
        success: false,
        error: '服务器不存在'
      });
    }

    const { host, port = 25565 } = server;
    // 替换为占位符API地址，用户需自行配置
    const apiUrl = `http://your-mc-api-host:port/api/mc/status?host=${host}&port=${port}&password=your-api-password`;

    console.log(`🔗 调用API: ${apiUrl}`);

    // 使用 AbortController 设置超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(apiUrl, { 
        signal: controller.signal 
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API返回错误: ${response.status} ${response.statusText}`);
      }

      const apiResult = await response.json();
      console.log('✅ API返回原始数据:', JSON.stringify(apiResult, null, 2));

      // 检查API调用是否成功
      if (!apiResult.success) {
        throw new Error('API返回失败状态');
      }

      const apiData = apiResult.data;
      
      // 解析API返回的数据结构
      const status = {
        online: apiData.online || false,
        players: apiData.players?.online || 0,
        maxPlayers: apiData.players?.max || 0,
        version: apiData.version || '未知',
        ping: apiData.ping || -1,
        motd: apiData.motd || ''
      };

      console.log(`✅ 解析后的状态:`, status);
      console.log(`✅ 服务器状态查询完成: ${server.name} - ${status.online ? '在线' : '离线'}`);
      
      res.json({
        success: true,
        data: status
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('❌ API调用失败:', fetchError);
      
      // API调用失败时返回离线状态
      res.json({
        success: true,
        data: {
          online: false,
          players: 0,
          maxPlayers: 0,
          version: '未知',
          ping: -1,
          motd: '状态查询失败'
        }
      });
    }
  } catch (err) {
    console.error('❌ 查询服务器状态报错:', err);
    res.status(500).json({
      success: false,
      error: '查询服务器状态失败'
    });
  }
});

// 6. 发送验证码接口
app.post('/api/send-verification-code', async (req, res) => {
  try {
    const sendSuccess = await sendVerificationCode();

    if (sendSuccess) {
      console.log('✅ 验证码已发送到指定邮箱');
      res.json({
        success: true,
        message: '验证码已发送到指定邮箱'
      });
    } else {
      res.status(500).json({
        success: false,
        error: '发送验证码失败，请稍后重试'
      });
    }
  } catch (err) {
    console.error('❌ 发送验证码失败:', err);
    res.status(500).json({
      success: false,
      error: '发送验证码失败'
    });
  }
});

// 7. 验证验证码接口
app.post('/api/verify-code', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: '验证码不能为空'
      });
    }

    const storedData = verificationCodes.get('admin');

    if (!storedData) {
      return res.status(400).json({
        success: false,
        error: '验证码不存在或已过期，请重新获取'
      });
    }

    // 检查是否过期
    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete('admin');
      return res.status(400).json({
        success: false,
        error: '验证码已过期，请重新获取'
      });
    }

    // 检查尝试次数
    if (storedData.attempts >= 5) {
      verificationCodes.delete('admin');
      return res.status(400).json({
        success: false,
        error: '尝试次数过多，请重新获取验证码'
      });
    }

    // 验证验证码
    if (storedData.code === code) {
      // 验证成功，删除验证码
      verificationCodes.delete('admin');
      res.json({
        success: true,
        message: '验证成功'
      });
    } else {
      // 验证失败，增加尝试次数
      storedData.attempts++;
      verificationCodes.set('admin', storedData);
      
      res.status(400).json({
        success: false,
        error: `验证码错误，还剩${5 - storedData.attempts}次尝试机会`
      });
    }
  } catch (err) {
    console.error('❌ 验证验证码失败:', err);
    res.status(500).json({
      success: false,
      error: '验证验证码失败'
    });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString()
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `接口不存在：${req.method} ${req.path}`
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('💥 全局错误:', err);
  res.status(500).json({
    success: false,
    error: '服务器内部错误'
  });
});

// 启动服务器
async function startServer() {
  // 验证邮箱配置
  try {
    await emailTransporter.verify();
    console.log('✅ 邮箱配置验证成功');
  } catch (error) {
    console.error('❌ 邮箱配置验证失败:', error);
    console.log('⚠️  请检查EMAIL_CONFIG中的邮箱配置');
  }
  
  await initializeDatabase();
  
  app.listen(PORT, () => {
    console.log('🎉 ==================================');
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log('✅ 服务启动完成！');
    console.log('📋 可用页面:');
    console.log(`   • 管理页面: http://localhost:${PORT}/admin.html`);
    console.log(`   • 用户页面: http://localhost:${PORT}/index.html`);
    console.log('🎉 ==================================');
  });
}

startServer();