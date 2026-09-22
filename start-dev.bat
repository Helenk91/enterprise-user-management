@echo off
rem ============================================
rem  用户管理系统 一键启动脚本
rem  MySQL + 后端(3000) + 前端(5173)
rem ============================================
title 用户管理系统-启动器

rem 1) 检查并启动 MySQL
tasklist /fi "imagename eq mysqld.exe" 2>nul | find /i "mysqld.exe" >nul
if %errorlevel%==0 (
  echo [1/3] MySQL 已在运行
) else (
  echo [1/3] 启动 MySQL ...
  start "MySQL" /min "D:\mysql\start-mysql.bat"
)

rem 2) 启动后端
echo [2/3] 启动后端 http://localhost:3000 ...
start "userdb-backend" cmd /k "cd /d D:\VSCODE\test\backend && node server.js"

rem 3) 启动前端
echo [3/3] 启动前端 http://localhost:5173 ...
start "userdb-frontend" cmd /k "cd /d D:\VSCODE\test\frontend && npm run dev"

echo.
echo 全部启动完成，稍等片刻后浏览器打开: http://localhost:5173
timeout /t 3 >nul
