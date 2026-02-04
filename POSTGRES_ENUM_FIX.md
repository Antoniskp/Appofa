# PostgreSQL ENUM + Comment Migration Fix

## Problem
This repository encountered a PostgreSQL migration error when using Sequelize's `sync({ alter: true })` with ENUM columns that have comments. The error occurred due to Sequelize bug [#17894](https://github.com/sequelize/sequelize/issues/17894).

### Invalid SQL Generated
Sequelize v6.37.7 incorrectly generates SQL like:
```sql
ALTER TABLE "Locations" ALTER COLUMN "type" TYPE "public"."enum_Locations_type" ; 
COMMENT ON COLUMN "Locations"."type" IS 'Hierarchical level of the location' 
USING ("type"::"public"."enum_Locations_type");
```

The issue is that the `USING` clause is placed in the `COMMENT ON COLUMN` statement, which is invalid PostgreSQL syntax.

### Error Message
```
syntax error at or near "USING"
```

## Solution
The fix works around the Sequelize bug by:
1. Removing `comment` properties from ENUM field definitions in models
2. Applying comments separately using direct SQL queries after `sync()` completes

### Files Modified
- **src/models/Location.js**: Removed `comment` from `type` ENUM field
- **src/models/LocationLink.js**: Removed `comment` from `entity_type` ENUM field
- **src/index.js**: Added post-sync hook to apply comments via SQL

### Code Changes
The fix is only applied in non-production environments where `sync()` is enabled. In production, migrations should be used instead of `sync()`.

```javascript
// After sequelize.sync({ alter: true })
await sequelize.query(`
  COMMENT ON COLUMN "${sequelize.models.Location.tableName}"."type" IS 'Hierarchical level of the location';
`);
await sequelize.query(`
  COMMENT ON COLUMN "${sequelize.models.LocationLink.tableName}"."entity_type" IS 'Type of entity linked to location';
`);
```

## Benefits
✅ No modification to node_modules  
✅ Comments are still in the database schema  
✅ Works around the Sequelize bug  
✅ Easy to maintain and understand  
✅ Can be removed when Sequelize fixes the bug  
✅ Only affects non-production environments

## Testing
All tests pass successfully:
- Location API tests: 15/15 ✓
- Server starts without errors ✓
- Comments verified in database ✓
- No security vulnerabilities ✓

## Future Improvements
When Sequelize fixes bug #17894, this workaround can be removed by:
1. Restoring `comment` properties to the ENUM fields in models
2. Removing the post-sync comment application code from `src/index.js`
3. Upgrading to the fixed Sequelize version

Alternatively, migrate to proper migration files instead of using `sync()` in production.

## Related Issues
- Sequelize Issue: https://github.com/sequelize/sequelize/issues/17894
- Affected Sequelize Version: 6.37.7

---
**Last Updated**: 2026-02-04
