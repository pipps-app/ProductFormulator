@echo off
REM ProductFormulator Database Backup Script
REM Run this regularly to backup your data

set BACKUP_DIR=backups
set TIMESTAMP=%date:~-4,4%-%date:~-10,2%-%date:~-7,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=pipps_maker_calc_%TIMESTAMP%.sql

if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%

echo Creating database backup: %BACKUP_FILE%
pg_dump -h localhost -U postgres -d pipps_maker_calc > %BACKUP_DIR%\%BACKUP_FILE%

if %ERRORLEVEL% == 0 (
    echo ✅ Backup successful: %BACKUP_DIR%\%BACKUP_FILE%
) else (
    echo ❌ Backup failed!
)

pause
