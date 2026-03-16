const pool = require('../config/db');
const haversineDistance = require('../utils/distance');

async function addSchool(req, res) {
  const { name, address, latitude, longitude } = req.body;

  if (!name || !address || latitude === undefined || longitude === undefined)
    return res.status(400).json({ error: 'All fields are required.' });

  if (typeof name !== 'string' || typeof address !== 'string')
    return res.status(400).json({ error: 'name and address must be strings.' });

  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180)
    return res.status(400).json({ error: 'Invalid latitude or longitude.' });

  const [result] = await pool.execute(
    'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)',
    [name.trim(), address.trim(), lat, lon]
  );

  res.status(201).json({ message: 'School added successfully.', id: result.insertId });
}

async function listSchools(req, res) {
  const userLat = parseFloat(req.query.latitude);
  const userLon = parseFloat(req.query.longitude);

  if (isNaN(userLat) || isNaN(userLon) || userLat < -90 || userLat > 90 || userLon < -180 || userLon > 180)
    return res.status(400).json({ error: 'Valid latitude and longitude query params are required.' });

  const [schools] = await pool.execute('SELECT * FROM schools').catch(err => { console.error(err); throw err; });

  const sorted = schools
    .map((s) => ({ ...s, distance: haversineDistance(userLat, userLon, s.latitude, s.longitude) }))
    .sort((a, b) => a.distance - b.distance);

  res.json(sorted);
}

module.exports = { addSchool, listSchools };
