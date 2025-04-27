# PostgreSQL Backup Strategy

## Overview
This project includes a robust and automated backup strategy for a PostgreSQL database, designed to ensure data integrity, security, and easy recovery in case of data loss or system failure. The backup process dynamically generates timestamped backup files and integrates with Google Drive for secure offsite storage.

---

## Features
1. **Dynamic Backup Script**
   - Creates timestamped `.dump` files for database backups.
   - Automatically checks for successful execution of the backup process.
   - Utilizes environment variables for securely handling credentials.

2. **Integration with Google Drive**
   - Backups are automatically uploaded to a designated folder in Google Drive.
   - Ensures offsite storage for enhanced disaster recovery.

3. **Customizable and Scalable**
   - Easily configurable to adapt to various PostgreSQL setups.
   - Supports environment variable-based configuration for flexibility.

4. **Minimal Downtime**
   - Designed to minimize downtime during backups by employing best practices for database consistency.

---

## Prerequisites

### Tools and Dependencies
- PostgreSQL installed locally.
- `pg_dumpall` utility (comes with PostgreSQL).
- [Rclone](https://rclone.org/) installed and configured for Google Drive.
- `.env` file to securely store database credentials and Google OAuth details.

### Required Environment Variables
Create a `.env` file in the root directory with the following variables:
```env
# PostgreSQL Credentials
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_password

# Google OAuth Settings
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URL=http://localhost:4000/auth/google/callback
```
> **Note:** Ensure the `.env` file is included in `.gitignore` to prevent accidental commits.

---

## Setup and Configuration

1. **Clone the Repository**
   ```bash
   git clone <repository_url>
   cd <repository_directory>
   ```

2. **Install Dependencies**
   - Install PostgreSQL and ensure `pg_dumpall` is accessible via the PATH.
   - Install [Rclone](https://rclone.org/downloads/) and configure it for Google Drive.

3. **Create a `.env` File**
   - Add PostgreSQL credentials and Google OAuth settings as shown in the prerequisites.

4. **Update `backup_postgres.bat` File**
   - The script reads credentials from the `.env` file and executes the backup process.
   - Ensure the `BACKUP_DIR` path is set to the desired local backup directory.

5. **Configure Google Drive Folder**
   - Use Rclone to specify the Google Drive folder for storing backups.

---

## Execution

1. **Manual Execution**
   - Run the backup script manually:
     ```bash
     ./backup_postgres.bat
     ```
   - Confirm backup success by checking the output and ensuring a `.dump` file is created in the backup directory.

2. **Scheduled Backups**
   - Use Task Scheduler to automate the script at regular intervals:
     - Open Task Scheduler.
     - Create a new task.
     - Set the trigger to run daily or weekly as per your requirements.
     - Set the action to run `backup_postgres.bat`.
     - Ensure the task runs whether the user is logged in or not.

---

## Testing the Backup

1. Verify the `.dump` file in the local backup directory.
2. Confirm the file is uploaded to the designated Google Drive folder using Rclone.
3. Test the restoration process using `pg_restore`:
   ```bash
   pg_restore -U postgres -d <database_name> <path_to_backup_file>
   ```

---

## Best Practices

- Schedule backups during off-peak hours to minimize database load.
- Regularly test the restoration process to ensure backup integrity.
- Monitor backup logs for errors and take corrective actions promptly.
- Store `.env` and other sensitive files securely.

---

## File Descriptions

### `backup_postgres.bat`
Automated script to:
- Generate timestamped PostgreSQL backups.
- Upload backups to Google Drive using Rclone.
- Log backup success or failure.

### `.env`
Holds sensitive credentials for PostgreSQL and Google OAuth. This file is excluded from version control for security purposes.

### `.gitignore`
Specifies files and directories to be ignored by Git, including `.env` and local backup directories.
# Media Content Management API - Response Format Guide (JSON and XML)

This API supports both **JSON** and **XML** responses for all resources.  
You can easily switch between JSON and XML by **adding `?format=xml`** to the end of the URL.
