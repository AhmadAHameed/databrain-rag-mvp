# Database Migrations

This directory contains all database-related migration files and tools for the Monolithic DataBrain project.

## Directory Structure

```
migrations/
├── README.md                 # This file - documentation for migrations
├── alembic.ini              # Alembic configuration file
├── alembic.ini.example      # Example Alembic configuration
├── alembic/                 # Alembic migration scripts and environment
│   ├── env.py              # Alembic environment configuration
│   ├── script.py.mako      # Template for new migration scripts
│   ├── README              # Alembic README
│   └── versions/           # Migration version files
│       ├── 29e0e8f6dd42_adding_chunk_metadata.py
│       ├── 39015ae510e0_add_status_to_chunk_and_doucment_tables.py
│       └── 750bcd1e35fa_init_alembic.py
├── dumps/                   # Database dump files
│   └── alldb_dump.sql      # Full database dump
└── snapshots/              # Database snapshots (for future use)
```

## Usage

### Running Migrations

To apply database migrations, run the following commands from the project root:

```bash
# Navigate to migrations directory
cd migrations

# Apply all pending migrations
alembic upgrade head

# Go back to project root
cd ..
```

### Creating New Migrations

To create a new migration after making changes to your models:

```bash
# Navigate to migrations directory
cd migrations

# Generate a new migration (auto-detect changes)
alembic revision --autogenerate -m "description_of_changes"

# Or create an empty migration file
alembic revision -m "description_of_changes"

# Go back to project root
cd ..
```

### Migration Management

```bash
# Check current migration status
cd migrations
alembic current

# View migration history
alembic history

# Downgrade to a specific revision
alembic downgrade <revision_id>

# Upgrade to a specific revision
alembic upgrade <revision_id>
```

## Configuration

The `alembic.ini` file contains the configuration for Alembic migrations. Key settings:

- `script_location`: Points to the `alembic/` directory containing migration scripts
- `prepend_sys_path`: Set to `..` to ensure the project root is in the Python path
- `sqlalchemy.url`: Database connection URL (should be set via environment variables)

## Database Dumps

The `dumps/` directory contains database dump files:

- `alldb_dump.sql`: Complete database dump for backup/restore purposes

## Snapshots

The `snapshots/` directory is reserved for future database snapshot functionality.

## Notes

- Always review auto-generated migrations before applying them
- Test migrations in a development environment first
- Keep migration scripts under version control
- The `prepend_sys_path = ..` setting ensures that the application models can be imported correctly from the migrations directory
