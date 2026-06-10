# Database Backup & Recovery Manual

This guide outlines the commands and validation steps to perform database backups and restores for the Gravure Management System.

---

## 1. Creating a Database Backup

Backups are executed using PostgreSQL's native `pg_dump` utility inside the postgres container to guarantee a consistent database snapshot.

### Execute Backup Command
Run the following command to export a compressed PostgreSQL custom-format backup archive:
```bash
docker exec -t gravure-postgres pg_dump -U gravure_user -d gravure_db -F c -b -v -f /var/lib/postgresql/gravure_db_backup.dump
```
*(This creates `gravure_db_backup.dump` inside the postgres data volume)*

### Copy Backup to Host Machine
Copy the backup archive file to a secure host directory or external storage mount:
```bash
docker cp gravure-postgres:/var/lib/postgresql/gravure_db_backup.dump ./backups/gravure_db_backup_$(date +%Y-%m-%d).dump
```

---

## 2. Restoring a Database

Restores are performed using the `pg_restore` utility. 

> [!CAUTION]
> Restoring a backup will overwrite existing database records. Disconnect active web connections (e.g. stop backend service) before executing restores.

### Step 1: Copy Backup back into Postgres container
```bash
docker cp ./backups/gravure_db_backup_2026-06-10.dump gravure-postgres:/var/lib/postgresql/restore.dump
```

### Step 2: Clear and recreate database schemas
Connect to postgres and run drop schemas commands to ensure no table locking conflicts:
```bash
docker exec -it gravure-postgres psql -U gravure_user -d gravure_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

### Step 3: Run Database Restore
Execute `pg_restore` inside the database container:
```bash
docker exec -it gravure-postgres pg_restore -U gravure_user -d gravure_db -v /var/lib/postgresql/restore.dump
```

---

## 3. Data Integrity & Verification Checks

After performing a restore, run these database queries to verify integrity:

1.  **Check Table Schema States**:
    Verify migrations applied successfully and client matches:
    ```bash
    docker compose exec backend npx prisma validate
    ```
2.  **Verify Row Counts**:
    Query critical tables to make sure data is present:
    ```bash
    docker exec -it gravure-postgres psql -U gravure_user -d gravure_db -c "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM sales_orders; SELECT COUNT(*) FROM audit_logs;"
    ```
3.  **Run System Health Diagnostics**:
    Validate that the backend API reconnects and queries the database:
    ```bash
    curl -s http://localhost:5000/health
    ```
