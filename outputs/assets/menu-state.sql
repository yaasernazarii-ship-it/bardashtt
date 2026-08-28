\pset format unaligned
\pset fieldsep ' | '

SELECT c.name, c.kind, c.icon, c.active, c.sort_order_dummy IS NULL AS x
FROM (SELECT name, kind, icon, active, NULL AS sort_order_dummy FROM "MenuCategory") c
LIMIT 0;

SELECT 'CATEGORIES' AS t, count(*) FROM "MenuCategory";
SELECT 'ITEMS' AS t, count(*) FROM "MenuItem";
SELECT 'ITEMS_WITH_IMAGE' AS t, count(*) FROM "MenuItem" WHERE "imageUrl" IS NOT NULL AND "imageUrl" <> '';

SELECT c."sortOrder", c.name, c.kind, coalesce(c.icon,'—') AS icon, c.active,
       (SELECT count(*) FROM "MenuItem" i WHERE i."categoryId" = c.id) AS items
FROM "MenuCategory" c ORDER BY c."sortOrder", c.name;
