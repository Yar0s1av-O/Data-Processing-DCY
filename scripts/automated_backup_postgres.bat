@echo off

:: ============================
:: PostgreSQL Backup Script
:: ============================

:: Set PostgreSQL credentials using environment variables
SET PGUSER=%DB_USER%
SET PGPASSWORD=%DB_PASSWORD%

:: Set backup directory and log file
SET BACKUP_DIR=C:\Users\ASUS\Documents\PostgresBackup
SET LOG_FILE=%BACKUP_DIR%\backup_log.txt

:: Extract the date (MM/DD/YYYY) and format as YYYY-MM-DD
for /f "tokens=1-3 delims=/" %%A in ("%DATE%") do (
    SET MONTH=%%A
    SET DAY=%%B
    SET YEAR=%%C
)
SET CUR_DATE=%YEAR%-%MONTH%-%DAY%

:: Set backup filename with formatted date
SET BACKUP_FILE=%BACKUP_DIR%\postgres-backup_%CUR_DATE%.dump

:: Ensure the backup directory exists
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

:: Start the backup process
echo [%DATE% %TIME%] Starting backup... >> "%LOG_FILE%"
"C:\Program Files\PostgreSQL\15\bin\pg_dumpall.exe" -U %PGUSER% -f "%BACKUP_FILE%"

:: Check if the backup was successful
if %ERRORLEVEL% EQU 0 (
    echo [%DATE% %TIME%] Backup successful: %BACKUP_FILE% >> "%LOG_FILE%"
) else (
    echo [%DATE% %TIME%] Backup failed. Please check logs. >> "%LOG_FILE%"
    exit /b 1
)

:: Upload the backup to Google Drive using rclone
SET REMOTE_NAME=postgresdrive
SET REMOTE_DIR=PostgresBackups
echo [%DATE% %TIME%] Uploading backup to Google Drive... >> "%LOG_FILE%"
rclone copy "%BACKUP_FILE%" %REMOTE_NAME%:%REMOTE_DIR% --log-file="%LOG_FILE%" --log-level=INFO

:: Check if the upload was successful
if %ERRORLEVEL% EQU 0 (
    echo [%DATE% %TIME%] Backup successfully uploaded to Google Drive. >> "%LOG_FILE%"
) else (
    echo [%DATE% %TIME%] Google Drive upload failed. Check logs. >> "%LOG_FILE%"
    exit /b 1
)

:: Optional: Delete backups older than 30 days from Google Drive
rclone delete %REMOTE_NAME%:%REMOTE_DIR% --min-age 30d --log-file="%LOG_FILE%" --log-level=INFO

:: Optional: Clean up local backups older than 30 days
forfiles /p "%BACKUP_DIR%" /s /m *.dump /d -30 /c "cmd /c del @path"

:: Log completion
echo [%DATE% %TIME%] Backup process completed. >> "%LOG_FILE%"

:: Pause to view the output (optional)
pause
