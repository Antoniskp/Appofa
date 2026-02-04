# Proposed Fix for PostgreSQL ENUM + Comment Issue

## Quick Fix Implementation (Option 5 - Recommended)

This approach keeps comments in the database but moves them outside the model definition to avoid the Sequelize bug.

### Files to Modify

#### 1. src/models/Location.js
Remove the comment from the ENUM field:

```javascript
type: {
  type: DataTypes.ENUM('international', 'country', 'prefecture', 'municipality'),
  allowNull: false,
  // Comment moved to post-sync hook to avoid Sequelize bug #17894
},
```

#### 2. src/models/LocationLink.js
Remove the comment from the ENUM field:

```javascript
entity_type: {
  type: DataTypes.ENUM('article', 'user'),
  allowNull: false,
  // Comment moved to post-sync hook to avoid Sequelize bug #17894
},
```

#### 3. src/index.js
Add a post-sync hook to apply comments (after line 69):

```javascript
if (!isProductionEnv()) {
  // Sync database models in non-production environments
  await sequelize.sync({ alter: true });
  console.log('Database models synchronized.');
  
  // Apply column comments separately to avoid Sequelize bug #17894
  // (ENUM + comment causes invalid USING clause in COMMENT statement)
  try {
    await sequelize.query(`
      COMMENT ON COLUMN "Locations"."type" IS 'Hierarchical level of the location';
    `);
    await sequelize.query(`
      COMMENT ON COLUMN "LocationLinks"."entity_type" IS 'Type of entity linked to location';
    `);
    console.log('Column comments applied successfully.');
  } catch (error) {
    // Ignore errors if columns don't exist yet (first run)
    if (!error.message.includes('does not exist')) {
      console.warn('Warning: Could not apply column comments:', error.message);
    }
  }
}
```

### Alternative: Create a Separate Sync Utility

Create a new file `src/utils/applyDatabaseComments.js`:

```javascript
const { sequelize } = require('../models');

const applyDatabaseComments = async () => {
  const comments = [
    {
      table: 'Locations',
      column: 'type',
      comment: 'Hierarchical level of the location'
    },
    {
      table: 'LocationLinks',
      column: 'entity_type',
      comment: 'Type of entity linked to location'
    }
  ];

  for (const { table, column, comment } of comments) {
    try {
      await sequelize.query(`
        COMMENT ON COLUMN "${table}"."${column}" IS '${comment}';
      `);
      console.log(`Applied comment to ${table}.${column}`);
    } catch (error) {
      if (!error.message.includes('does not exist')) {
        console.warn(`Warning: Could not apply comment to ${table}.${column}:`, error.message);
      }
    }
  }
};

module.exports = applyDatabaseComments;
```

Then import and use in `src/index.js`:

```javascript
const applyDatabaseComments = require('./utils/applyDatabaseComments');

// After sync
if (!isProductionEnv()) {
  await sequelize.sync({ alter: true });
  console.log('Database models synchronized.');
  await applyDatabaseComments();
}
```

## Testing the Fix

1. Drop existing tables (if in development):
```sql
DROP TABLE IF EXISTS "LocationLinks" CASCADE;
DROP TABLE IF EXISTS "Locations" CASCADE;
DROP TYPE IF EXISTS "enum_Locations_type";
DROP TYPE IF EXISTS "enum_LocationLinks_entity_type";
```

2. Restart the application
3. Verify comments are applied:
```sql
SELECT 
    c.table_name,
    c.column_name,
    pgd.description
FROM pg_catalog.pg_statio_all_tables AS st
INNER JOIN pg_catalog.pg_description pgd ON (pgd.objoid = st.relid)
INNER JOIN information_schema.columns c ON (
    pgd.objsubid = c.ordinal_position AND
    c.table_schema = st.schemaname AND
    c.table_name = st.relname
)
WHERE c.table_name IN ('Locations', 'LocationLinks')
AND c.column_name IN ('type', 'entity_type');
```

## Benefits of This Approach

1. ✅ No modification to node_modules
2. ✅ Comments are still in the database schema
3. ✅ Works around the Sequelize bug
4. ✅ Easy to maintain and understand
5. ✅ Can be removed when Sequelize fixes the bug
6. ✅ Works with existing production setup (sync disabled in prod)

## Future: Migration to Proper Migrations

When ready to use proper migrations, you can:
1. Create a migrations directory
2. Generate migration files for each table
3. Apply comments in the migration
4. Remove the post-sync hook
5. Disable sync entirely in favor of migrations
