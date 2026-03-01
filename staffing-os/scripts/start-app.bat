@echo off
TITLE Staffing OS - Panel (Puerto 3433)
COLOR 0B

:: Cambia al directorio raiz del proyecto (padre de scripts/)
cd /d "%~dp0.."

echo =======================================================
echo             INICIANDO STAFFING OS
echo =======================================================
echo.

echo [1/3] Verificando e iniciando la base de datos (Docker)...
call docker-compose up -d

echo.
echo [2/3] Sincronizando esquema de Prisma (opcional pero recomendado)...
call npx --yes prisma generate

echo.
echo [3/3] Levantando el servidor de Next.js en el puerto 3433...
echo.
echo (Una vez que el servidor inicie, abre: http://localhost:3433)
echo (Presiona Ctrl + C para detener el servidor)
echo.

call npm run dev

pause
