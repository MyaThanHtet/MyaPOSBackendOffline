@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "APP_ROOT=%%~fI"
set "NODE_BIN_DIR=%APP_ROOT%\node-bin"
set "NODE_EXE=%NODE_BIN_DIR%\node.exe"
set "NPM_BIN=%NODE_BIN_DIR%\npm.cmd"

cd /d "%APP_ROOT%" || goto :fail_cd

if not exist "%NODE_EXE%" goto :fail_node
if not exist "%SCRIPT_DIR%..\node-bin\node.exe" goto :fail_node_script_path

if not exist "%NPM_BIN%" goto :fail_npm

rem Use local Node.js binaries only for this process
set "PATH=%NODE_BIN_DIR%;%PATH%"

rem Keep npm state inside the project for portability
set "npm_config_prefix=%APP_ROOT%\.npm-prefix"
set "npm_config_cache=%APP_ROOT%\.npm-cache"
if not exist "%npm_config_prefix%" mkdir "%npm_config_prefix%" >nul 2>&1
if not exist "%npm_config_cache%" mkdir "%npm_config_cache%" >nul 2>&1

if not exist ".env" (
  copy ".env.example" ".env" >nul 2>&1
)

set "NEED_INSTALL=0"
if not exist "node_modules" set "NEED_INSTALL=1"
if exist "node_modules" (
  "%NODE_EXE%" -e "require('express'); require('sqlite3');" >nul 2>nul
  if errorlevel 1 set "NEED_INSTALL=1"
)

if "%NEED_INSTALL%"=="1" (
  if exist "node_modules" (
    rmdir /s /q "node_modules" >nul 2>&1
    if errorlevel 1 goto :fail_remove_node_modules
  )
  call "%NPM_BIN%" install >nul 2>&1
  if errorlevel 1 goto :fail_install
)

"%NODE_EXE%" "src\server.js" >nul 2>&1
exit /b %ERRORLEVEL%

:fail_cd
exit /b 1

:fail_node
exit /b 1

:fail_node_script_path
exit /b 1

:fail_npm
exit /b 1

:fail_remove_node_modules
exit /b 1

:fail_install
exit /b 1
