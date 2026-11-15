-- 1. JOIN: show each field with its crop details.
SELECT f.id, f.name AS field_name, f.area, f."soilType", c.name AS crop_name,
       c."minMoisture", c."maxMoisture"
FROM "Field" AS f
JOIN "Crop" AS c ON c.id = f."cropId"
ORDER BY f.name;

-- 2. GROUP BY + SUM: total irrigation water used per field.
SELECT f.name AS field_name,
       COALESCE(SUM(i."waterUsedLitres"), 0) AS total_water_litres
FROM "Field" AS f
LEFT JOIN "IrrigationLog" AS i ON i."fieldId" = f.id
GROUP BY f.id, f.name
ORDER BY total_water_litres DESC;

-- 3. AVG: average moisture for every field.
SELECT f.name AS field_name, ROUND(AVG(s.moisture)::numeric, 2) AS average_moisture
FROM "Field" AS f
JOIN "SoilReading" AS s ON s."fieldId" = f.id
GROUP BY f.id, f.name
ORDER BY average_moisture ASC;

-- 4. Latest moisture reading per field using DISTINCT ON (PostgreSQL).
SELECT DISTINCT ON ("fieldId") "fieldId", moisture, "recordedAt"
FROM "SoilReading"
ORDER BY "fieldId", "recordedAt" DESC;

-- 5. Subquery: fields whose latest moisture is below their crop minimum.
SELECT f.name, c.name AS crop_name, latest.moisture, c."minMoisture"
FROM "Field" AS f
JOIN "Crop" AS c ON c.id = f."cropId"
JOIN LATERAL (
  SELECT moisture
  FROM "SoilReading"
  WHERE "fieldId" = f.id
  ORDER BY "recordedAt" DESC
  LIMIT 1
) AS latest ON TRUE
WHERE latest.moisture < c."minMoisture";

-- 6. Date grouping: water usage by day.
SELECT DATE("irrigatedAt") AS irrigation_day,
       SUM("waterUsedLitres") AS total_water_litres
FROM "IrrigationLog"
GROUP BY DATE("irrigatedAt")
ORDER BY irrigation_day DESC;
