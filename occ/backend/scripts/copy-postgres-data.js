const { Client } = require('pg');

const sourceUrl = process.env.SOURCE_DATABASE_URL;
const targetUrl = process.env.TARGET_DATABASE_URL;

if (!sourceUrl || !targetUrl) {
  console.error('SOURCE_DATABASE_URL and TARGET_DATABASE_URL are required.');
  process.exit(1);
}

const source = new Client({ connectionString: sourceUrl, ssl: { rejectUnauthorized: false } });
const target = new Client({ connectionString: targetUrl, ssl: { rejectUnauthorized: false } });

function quoteIdent(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

async function getUserTables(client) {
  const result = await client.query(
    `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name <> '_prisma_migrations'
      ORDER BY table_name
    `,
  );

  return result.rows.map((row) => row.table_name);
}

async function getColumnMap(client, tableName) {
  const result = await client.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
      ORDER BY ordinal_position
    `,
    [tableName],
  );

  return result.rows;
}

async function getForeignKeyDependencies(client) {
  const result = await client.query(`
    SELECT
      tc.table_name AS table_name,
      ccu.table_name AS referenced_table_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
     AND tc.table_schema = ccu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
  `);

  const graph = new Map();
  for (const row of result.rows) {
    if (!graph.has(row.table_name)) {
      graph.set(row.table_name, new Set());
    }
    if (row.table_name !== row.referenced_table_name) { graph.get(row.table_name).add(row.referenced_table_name); }
  }
  return graph;
}

function topologicalSort(tables, dependencyGraph) {
  const visited = new Set();
  const temp = new Set();
  const ordered = [];

  function visit(table) {
    if (visited.has(table)) return;
    if (temp.has(table)) {
      throw new Error(`Cycle detected while sorting table dependencies at ${table}`);
    }
    temp.add(table);
    const deps = dependencyGraph.get(table) || new Set();
    for (const dep of deps) {
      if (tables.includes(dep)) visit(dep);
    }
    temp.delete(table);
    visited.add(table);
    ordered.push(table);
  }

  for (const table of tables) {
    visit(table);
  }

  return ordered;
}

async function truncateTargetTables(client, orderedTables) {
  const reversed = [...orderedTables].reverse();
  if (!reversed.length) return;
  const quotedTables = reversed.map((table) => quoteIdent(table)).join(', ');
  await client.query(`TRUNCATE TABLE ${quotedTables} RESTART IDENTITY CASCADE`);
}

async function copyTable(tableName) {
  const columns = await getColumnMap(source, tableName);
  if (!columns.length) return { tableName, copied: 0 };

  const quotedTable = quoteIdent(tableName);
  const quotedColumns = columns.map((column) => quoteIdent(column.column_name));
  const orderClause = tableName === 'Comment' ? ' ORDER BY "parentId" NULLS FIRST, "createdAt" ASC, "id" ASC' : '';
  const selectSql = `SELECT ${quotedColumns.join(', ')} FROM ${quotedTable}${orderClause}`;
  const rows = (await source.query(selectSql)).rows;

  if (!rows.length) {
    return { tableName, copied: 0 };
  }

  const insertSql = `INSERT INTO ${quotedTable} (${quotedColumns.join(', ')}) VALUES (${quotedColumns
    .map((_, index) => `$${index + 1}`)
    .join(', ')})`;

  for (const row of rows) {
    const values = columns.map((column) => row[column.column_name]);
    await target.query(insertSql, values);
  }

  return { tableName, copied: rows.length };
}

async function getTableCounts(client, tables) {
  const counts = {};
  for (const table of tables) {
    const result = await client.query(`SELECT COUNT(*)::int AS count FROM ${quoteIdent(table)}`);
    counts[table] = result.rows[0].count;
  }
  return counts;
}

async function main() {
  await source.connect();
  await target.connect();

  try {
    const tables = await getUserTables(source);
    const dependencyGraph = await getForeignKeyDependencies(source);
    const orderedTables = topologicalSort(tables, dependencyGraph);

    console.log('Copy order:', orderedTables.join(', '));

    await target.query('BEGIN');
    await truncateTargetTables(target, orderedTables);

    for (const table of orderedTables) {
      const result = await copyTable(table);
      console.log(`Copied ${result.copied} row(s) into ${table}`);
    }

    await target.query('COMMIT');

    const sourceCounts = await getTableCounts(source, orderedTables);
    const targetCounts = await getTableCounts(target, orderedTables);

    const mismatches = orderedTables.filter((table) => sourceCounts[table] !== targetCounts[table]);
    console.log('Source counts:', JSON.stringify(sourceCounts, null, 2));
    console.log('Target counts:', JSON.stringify(targetCounts, null, 2));

    if (mismatches.length) {
      console.error(`Count mismatch detected for: ${mismatches.join(', ')}`);
      process.exitCode = 1;
      return;
    }

    console.log('Data copy completed successfully with matching row counts.');
  } catch (error) {
    await target.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    await Promise.all([source.end(), target.end()]);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
