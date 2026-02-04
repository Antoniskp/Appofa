# 🚀 Quick Reference Card - PostgreSQL ENUM Bug Fix

## ⚡ TL;DR
Sequelize 6.37.7 bug: ENUM columns with comments generate invalid SQL.  
**Fix:** Move comments to post-sync SQL queries.

---

## 📝 3 FILES TO CHANGE

### 1️⃣ src/models/Location.js (Line 23)
```diff
  type: {
    type: DataTypes.ENUM('international', 'country', 'prefecture', 'municipality'),
    allowNull: false,
-   comment: 'Hierarchical level of the location'
+   // Comment moved to post-sync hook to avoid Sequelize bug #17894
  },
```

### 2️⃣ src/models/LocationLink.js (Line 23)
```diff
  entity_type: {
    type: DataTypes.ENUM('article', 'user'),
    allowNull: false,
-   comment: 'Type of entity linked to location'
+   // Comment moved to post-sync hook to avoid Sequelize bug #17894
  },
```

### 3️⃣ src/index.js (After Line 70)
```diff
  if (!isProductionEnv()) {
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized.');
+   
+   // Apply column comments separately to avoid Sequelize bug #17894
+   try {
+     await sequelize.query(`
+       COMMENT ON COLUMN "Locations"."type" IS 'Hierarchical level of the location';
+     `);
+     await sequelize.query(`
+       COMMENT ON COLUMN "LocationLinks"."entity_type" IS 'Type of entity linked to location';
+     `);
+     console.log('Column comments applied successfully.');
+   } catch (error) {
+     if (!error.message.includes('does not exist')) {
+       console.warn('Warning: Could not apply column comments:', error.message);
+     }
+   }
  }
```

---

## 🧪 Testing Steps

```bash
# 1. Make the changes above
# 2. Drop tables (dev only)
psql -d newsapp -c "DROP TABLE IF EXISTS \"LocationLinks\" CASCADE;"
psql -d newsapp -c "DROP TABLE IF EXISTS \"Locations\" CASCADE;"

# 3. Restart app
npm run dev

# 4. Verify comments
psql -d newsapp -c "
SELECT c.table_name, c.column_name, pgd.description 
FROM pg_catalog.pg_statio_all_tables AS st
INNER JOIN pg_catalog.pg_description pgd ON (pgd.objoid = st.relid)
INNER JOIN information_schema.columns c ON (
    pgd.objsubid = c.ordinal_position AND
    c.table_schema = st.schemaname AND
    c.table_name = st.relname
)
WHERE c.column_name IN ('type', 'entity_type');
"
```

---

## 📚 Full Documentation

- **Start Here:** INVESTIGATION_SUMMARY.md
- **Implementation:** PROPOSED_FIX.md  
- **Technical Deep Dive:** BUG_FLOW_ANALYSIS.md
- **Complete Report:** FINAL_FINDINGS.md

---

## 🔗 Links

- Bug Report: https://github.com/sequelize/sequelize/issues/17894
- Sequelize: v6.37.7
- Status: Known bug, no official fix yet

---

**Last Updated:** $(date +%Y-%m-%d)
