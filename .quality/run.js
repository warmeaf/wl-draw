import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// ES Module 中获取 __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * 主函数：检查环境 + 执行目标脚本
 */
function main() {
  // 1. 检查 Node.js 环境
  checkNodeEnv()

  // 2. 检查核心脚本是否存在
  const targetScript = path.join(__dirname, 'generate-file-structure.js')
  if (!fs.existsSync(targetScript)) {
    console.error(`❌ 错误：核心脚本不存在 -> ${targetScript}`)
    console.error('   请确保 generate-file-structure.js 与 run.js 在同一目录')
    process.exit(1)
  }

  // 3. 定义要执行的命令参数
  const args = ['./src', './quality/quality.json'] // 目标目录 + 输出文件名
  console.log(`🔍 正在执行：node generate-file-structure.js ${args.join(' ')}`)
  console.log('--------------------------------------------------')

  // 4. 同步执行命令（保证输出顺序，便于查看结果）
  const result = spawnSync(process.execPath, [targetScript, ...args], {
    stdio: 'inherit', // 继承父进程的输入输出（直接显示 generate-file-structure.js 的日志）
    encoding: 'utf-8',
  })

  // 5. 处理执行结果
  if (result.status !== 0) {
    console.log('--------------------------------------------------')
    console.error('❌ 脚本执行失败！请查看上方错误信息')
    process.exit(1)
  }
}

/**
 * 检查 Node.js 环境是否可用
 */
function checkNodeEnv() {
  try {
    // 执行 node -v 检查是否安装 Node.js
    const nodeCheck = spawnSync(process.execPath, ['-v'], { encoding: 'utf-8' })
    if (nodeCheck.error) {
      throw new Error('未找到 Node.js 可执行文件')
    }
    console.log(`ℹ️ 当前 Node.js 版本：${nodeCheck.stdout.trim()}`)
  } catch (_) {
    console.error('❌ 错误：Node.js 环境不可用')
    console.error('   请先安装 Node.js（推荐 14.13+ 版本）：https://nodejs.org/')
    process.exit(1)
  }
}

// 执行主函数
main()
