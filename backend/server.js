// ============================================================
//  Agrovision v2 — Express + PostgreSQL Backend
//  Install: npm install express pg bcrypt cors dotenv
//  Run:     node server.js
// ============================================================
require('dotenv').config();
const express  = require('express');
const { Pool } = require('pg');
const bcrypt   = require('bcrypt');
const cors     = require('cors');

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// ─── DB Pool ──────────────────────────────────────────────────────────────────
const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'smart_farming',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'yourpassword',
  max: 10,
});

// Ensure UTF-8 encoding on every new connection
pool.on('connect', client => {
  client.query("SET client_encoding = 'UTF8'");
});

const q = (text, params) => pool.query(text, params);

// ============================================================
//  AUTH
// ============================================================

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  try {
    const result = await q(
      `SELECT u.*, f.full_name, f.farmer_code, f.location, f.contact
       FROM users u LEFT JOIN farmers f ON f.farmer_id = u.farmer_id
       WHERE u.username = $1 AND u.is_active = TRUE`,
      [username]
    );
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({
      user_id:    user.user_id,
      username:   user.username,
      role:       user.role,
      farmer_id:  user.farmer_id,
      full_name:  user.full_name  || 'Administrator',
      farmer_code: user.farmer_code || null,
      location:   user.location   || null,
      contact:    user.contact    || null,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// ============================================================
//  FARMERS (Admin only)
// ============================================================

// GET /api/farmers
app.get('/api/farmers', async (req, res) => {
  try {
    const result = await q(`
      SELECT f.*, u.username, u.is_active AS user_active,
             COUNT(fm.farm_id)::INT AS farm_count
      FROM   farmers f
      LEFT   JOIN users u  ON u.farmer_id = f.farmer_id AND u.role='farmer'
      LEFT   JOIN farms fm ON fm.farmer_id = f.farmer_id
      GROUP  BY f.farmer_id, u.username, u.is_active
      ORDER  BY f.farmer_id
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/farmers — create farmer + user account in one transaction
app.post('/api/farmers', async (req, res) => {
  const { farmerCode, fullName, contact, location, username, password, status = 'Active' } = req.body;
  if (!farmerCode || !fullName || !username || !password)
    return res.status(400).json({ error: 'farmerCode, fullName, username, password are required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const fResult = await client.query(
      `INSERT INTO farmers(farmer_code,full_name,contact,location,status) VALUES($1,$2,$3,$4,$5) RETURNING *`,
      [farmerCode, fullName, contact, location, status]
    );
    const farmer = fResult.rows[0];
    const hash = await bcrypt.hash(password, 10);
    const uResult = await client.query(
      `INSERT INTO users(username,password_hash,role,farmer_id) VALUES($1,$2,'farmer',$3) RETURNING user_id,username,role`,
      [username, hash, farmer.farmer_id]
    );
    await client.query('COMMIT');
    res.status(201).json({ farmer, user: uResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally { client.release(); }
});

// PUT /api/farmers/:id
app.put('/api/farmers/:id', async (req, res) => {
  const { fullName, contact, location, status } = req.body;
  try {
    const result = await q(
      `UPDATE farmers SET full_name=$1,contact=$2,location=$3,status=$4 WHERE farmer_id=$5 RETURNING *`,
      [fullName, contact, location, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/farmers/:id
app.delete('/api/farmers/:id', async (req, res) => {
  try {
    await q('DELETE FROM farmers WHERE farmer_id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// ============================================================
//  FARMS
// ============================================================

// GET /api/farms?farmer_id=1
app.get('/api/farms', async (req, res) => {
  try {
    const { farmer_id } = req.query;
    let text = `SELECT fm.*,f.full_name AS farmer_name,fn_crop_count(fm.farm_id) AS crop_count
                FROM farms fm JOIN farmers f ON f.farmer_id=fm.farmer_id`;
    const params = [];
    if (farmer_id) { text += ' WHERE fm.farmer_id=$1'; params.push(farmer_id); }
    text += ' ORDER BY fm.farm_id';
    const result = await q(text, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/farms
app.post('/api/farms', async (req, res) => {
  const { farmCode, location, areaHa, farmerId } = req.body;
  try {
    const result = await q(
      `INSERT INTO farms(farm_code,location,area_ha,farmer_id) VALUES($1,$2,$3,$4) RETURNING *`,
      [farmCode, location, areaHa, farmerId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/farms/:id
app.put('/api/farms/:id', async (req, res) => {
  const { location, areaHa, status } = req.body;
  try {
    const result = await q(
      `UPDATE farms SET location=$1,area_ha=$2,status=$3 WHERE farm_id=$4 RETURNING *`,
      [location, areaHa, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// ============================================================
//  EQUIPMENT
// ============================================================

app.get('/api/equipment', async (req, res) => {
  const { farmer_id } = req.query;
  try {
    let text = `SELECT e.*,f.full_name AS farmer_name FROM equipment e JOIN farmers f ON f.farmer_id=e.farmer_id`;
    const params = [];
    if (farmer_id) { text += ' WHERE e.farmer_id=$1'; params.push(farmer_id); }
    text += ' ORDER BY e.equip_id';
    const result = await q(text, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/equipment', async (req, res) => {
  const { equipCode, equipName, model, farmerId, condition = 'Good' } = req.body;
  try {
    const result = await q(
      `INSERT INTO equipment(equip_code,equip_name,model,farmer_id,condition) VALUES($1,$2,$3,$4,$5) RETURNING *`,
      [equipCode, equipName, model, farmerId, condition]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/equipment/:id', async (req, res) => {
  const { equipName, model, condition } = req.body;
  try {
    const result = await q(
      `UPDATE equipment SET equip_name=$1,model=$2,condition=$3 WHERE equip_id=$4 RETURNING *`,
      [equipName, model, condition, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/equipment/:id', async (req, res) => {
  try {
    await q('DELETE FROM equipment WHERE equip_id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// ============================================================
//  FERTILIZERS
// ============================================================

app.get('/api/fertilizers', async (req, res) => {
  const { farm_id, farmer_id } = req.query;
  try {
    let text = `SELECT f.*,fm.farm_code,
                       CASE WHEN f.next_due < CURRENT_DATE THEN TRUE ELSE FALSE END AS is_overdue,
                       (CURRENT_DATE - f.next_due) AS days_overdue
                FROM fertilizers f JOIN farms fm ON fm.farm_id=f.farm_id`;
    const params = [];
    if (farm_id)   { text += ' WHERE f.farm_id=$1'; params.push(farm_id); }
    else if (farmer_id) { text += ' WHERE fm.farmer_id=$1'; params.push(farmer_id); }
    text += ' ORDER BY f.fert_id';
    res.json((await q(text, params)).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/fertilizers', async (req, res) => {
  const { fertName, fertType, quantityKg, farmId, lastApplied, frequencyDays = 30 } = req.body;
  try {
    const result = await q(
      `INSERT INTO fertilizers(fert_name,fert_type,quantity_kg,farm_id,last_applied,frequency_days)
       VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
      [fertName, fertType, quantityKg, farmId, lastApplied, frequencyDays]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/fertilizers/:id', async (req, res) => {
  const { fertName, fertType, quantityKg, farmId, lastApplied, frequencyDays } = req.body;
  try {
    const result = await q(
      `UPDATE fertilizers SET fert_name=$1,fert_type=$2,quantity_kg=$3,farm_id=$4,last_applied=$5,frequency_days=$6 WHERE fert_id=$7 RETURNING *`,
      [fertName, fertType, quantityKg, farmId, lastApplied || null, frequencyDays || 30, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/fertilizers/:id/apply — record application
app.patch('/api/fertilizers/:id/apply', async (req, res) => {
  const { quantityUsed, appliedDate } = req.body;
  try {
    const result = await q(
      `UPDATE fertilizers
       SET used_kg = used_kg + $1, last_applied = $2
       WHERE fert_id = $3 RETURNING *`,
      [quantityUsed, appliedDate || new Date().toISOString().slice(0,10), req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/fertilizers/:id', async (req, res) => {
  try { await q('DELETE FROM fertilizers WHERE fert_id=$1',[req.params.id]); res.json({success:true}); }
  catch (err) { res.status(500).json({ error: err.message }); }
});


// ============================================================
//  PESTICIDES
// ============================================================

app.get('/api/pesticides', async (req, res) => {
  const { farm_id, farmer_id } = req.query;
  try {
    let text = `SELECT p.*,fm.farm_code,
                       CASE WHEN p.next_due < CURRENT_DATE THEN TRUE ELSE FALSE END AS is_overdue,
                       (CURRENT_DATE - p.next_due) AS days_overdue
                FROM pesticides p JOIN farms fm ON fm.farm_id=p.farm_id`;
    const params = [];
    if (farm_id)    { text += ' WHERE p.farm_id=$1'; params.push(farm_id); }
    else if (farmer_id) { text += ' WHERE fm.farmer_id=$1'; params.push(farmer_id); }
    text += ' ORDER BY p.pest_id';
    res.json((await q(text, params)).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/pesticides', async (req, res) => {
  const { pestName, pestType, quantityL, farmId, lastApplied, frequencyDays = 21 } = req.body;
  try {
    const result = await q(
      `INSERT INTO pesticides(pest_name,pest_type,quantity_l,farm_id,last_applied,frequency_days)
       VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
      [pestName, pestType, quantityL, farmId, lastApplied, frequencyDays]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/pesticides/:id', async (req, res) => {
  const { pestName, pestType, quantityL, farmId, lastApplied, frequencyDays } = req.body;
  try {
    const result = await q(
      `UPDATE pesticides SET pest_name=$1,pest_type=$2,quantity_l=$3,farm_id=$4,last_applied=$5,frequency_days=$6 WHERE pest_id=$7 RETURNING *`,
      [pestName, pestType, quantityL, farmId, lastApplied || null, frequencyDays || 21, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/pesticides/:id/apply
app.patch('/api/pesticides/:id/apply', async (req, res) => {
  const { quantityUsed, appliedDate } = req.body;
  try {
    const result = await q(
      `UPDATE pesticides SET used_l=used_l+$1,last_applied=$2 WHERE pest_id=$3 RETURNING *`,
      [quantityUsed, appliedDate || new Date().toISOString().slice(0,10), req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/pesticides/:id', async (req, res) => {
  try { await q('DELETE FROM pesticides WHERE pest_id=$1',[req.params.id]); res.json({success:true}); }
  catch (err) { res.status(500).json({ error: err.message }); }
});


// ============================================================
//  IRRIGATION
// ============================================================

app.get('/api/irrigation', async (req, res) => {
  const { farm_id, farmer_id } = req.query;
  try {
    let text = `SELECT i.*,fm.farm_code,
                       CASE WHEN i.next_due < NOW() AND i.status='Active' THEN TRUE ELSE FALSE END AS is_overdue,
                       EXTRACT(EPOCH FROM (NOW()-i.next_due))/3600 AS hours_overdue
                FROM irrigation i JOIN farms fm ON fm.farm_id=i.farm_id`;
    const params = [];
    if (farm_id)    { text += ' WHERE i.farm_id=$1'; params.push(farm_id); }
    else if (farmer_id) { text += ' WHERE fm.farmer_id=$1'; params.push(farmer_id); }
    text += ' ORDER BY i.irr_id';
    res.json((await q(text, params)).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/irrigation', async (req, res) => {
  const { farmId, irrType, waterSource, schedule, frequencyDays = 1, lastIrrigated } = req.body;
  try {
    const result = await q(
      `INSERT INTO irrigation(farm_id,irr_type,water_source,schedule,frequency_days,last_irrigated)
       VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
      [farmId, irrType, waterSource, schedule, frequencyDays, lastIrrigated || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/irrigation/:id/irrigate — record irrigation done
app.patch('/api/irrigation/:id/irrigate', async (req, res) => {
  const { irrigatedAt } = req.body;
  try {
    const result = await q(
      `UPDATE irrigation SET last_irrigated=$1,status='Active',updated_at=NOW() WHERE irr_id=$2 RETURNING *`,
      [irrigatedAt || new Date().toISOString(), req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/irrigation/:id', async (req, res) => {
  const { schedule, frequencyDays, status, waterSource, irrType } = req.body;
  try {
    const result = await q(
      `UPDATE irrigation SET schedule=$1,frequency_days=$2,status=$3,water_source=$4,irr_type=$5,updated_at=NOW()
       WHERE irr_id=$6 RETURNING *`,
      [schedule, frequencyDays, status, waterSource, irrType, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// ============================================================
//  ALERTS & REMINDERS
// ============================================================

// GET /api/alerts?farm_id=1 or ?farmer_id=1
app.get('/api/alerts', async (req, res) => {
  const { farm_id, farmer_id } = req.query;
  try {
    let text = `SELECT a.*,fm.farm_code FROM alerts a JOIN farms fm ON fm.farm_id=a.farm_id WHERE a.is_resolved=FALSE`;
    const params = [];
    if (farm_id)    { text += ' AND a.farm_id=$1'; params.push(farm_id); }
    else if (farmer_id) { text += ' AND fm.farmer_id=$1'; params.push(farmer_id); }
    text += ' ORDER BY a.created_at DESC';
    res.json((await q(text, params)).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/reminders?farmer_id=1 — checks overdue irrigation/fertilizer/pesticide
app.get('/api/reminders', async (req, res) => {
  const { farmer_id } = req.query;
  try {
    const farms = await q('SELECT farm_id FROM farms WHERE farmer_id=$1', [farmer_id]);
    const reminders = [];
    for (const farm of farms.rows) {
      const r = await q('SELECT * FROM fn_check_reminders($1)', [farm.farm_id]);
      reminders.push(...r.rows.map(row => ({ ...row, farm_id: farm.farm_id })));
    }
    res.json(reminders);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/alerts/:id/resolve
app.patch('/api/alerts/:id/resolve', async (req, res) => {
  try {
    const result = await q('UPDATE alerts SET is_resolved=TRUE WHERE alert_id=$1 RETURNING *', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// ============================================================
//  SENSOR DATA
// ============================================================

app.get('/api/sensors', async (req, res) => {
  const { farm_id } = req.query;
  try {
    let text = `SELECT DISTINCT ON (s.farm_id,s.sensor_type)
                       s.*,fm.farm_code
                FROM sensor_data s JOIN farms fm ON fm.farm_id=s.farm_id`;
    const params = [];
    if (farm_id) { text += ' WHERE s.farm_id=$1'; params.push(farm_id); }
    text += ' ORDER BY s.farm_id,s.sensor_type,s.recorded_at DESC';
    res.json((await q(text, params)).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// ============================================================
//  DASHBOARD SUMMARY
// ============================================================

app.get('/api/dashboard', async (req, res) => {
  try {
    const result = await q(`
      SELECT
        (SELECT COUNT(*) FROM farmers)::INT                                AS total_farmers,
        (SELECT COUNT(*) FROM farms)::INT                                  AS total_farms,
        (SELECT COUNT(*) FROM crops WHERE status!='Harvested')::INT        AS total_crops,
        (SELECT COUNT(*) FROM alerts WHERE is_resolved=FALSE)::INT         AS total_alerts,
        (SELECT COUNT(*) FROM irrigation WHERE next_due < NOW()
           AND status='Active')::INT                                       AS irrigation_overdue,
        (SELECT COUNT(*) FROM fertilizers WHERE next_due < CURRENT_DATE)::INT AS fertilizer_overdue,
        (SELECT COUNT(*) FROM pesticides   WHERE next_due < CURRENT_DATE)::INT AS pesticide_overdue
    `);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Crops (read only for now) ────────────────────────────────────────────────
app.get('/api/crops', async (req, res) => {
  const { farm_id, farmer_id } = req.query;
  try {
    let text = `
      SELECT c.crop_id, c.crop_code, c.crop_name, c.season,
             c.planted_date, c.harvest_date, c.progress_pct, c.farm_id, c.created_at,
             fm.farm_code, f.full_name AS farmer_name,
             CASE
               WHEN c.harvest_date < CURRENT_DATE THEN 'Harvested'
               ELSE c.status
             END AS status
      FROM crops c
      JOIN farms fm ON fm.farm_id = c.farm_id
      JOIN farmers f ON f.farmer_id = fm.farmer_id`;
    const params = [];
    if (farm_id)        { text += ' WHERE c.farm_id=$1';    params.push(farm_id); }
    else if (farmer_id) { text += ' WHERE fm.farmer_id=$1'; params.push(farmer_id); }
    text += ' ORDER BY c.crop_id';
    res.json((await q(text, params)).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
//  LABOUR
// ============================================================
app.get('/api/labour', async (req, res) => {
  const { farmer_id } = req.query;
  try {
    let text = `SELECT l.*,f.full_name AS farmer_name,fm.farm_code FROM labour l
                JOIN farmers f ON f.farmer_id=l.farmer_id
                LEFT JOIN farms fm ON fm.farm_id=l.farm_id`;
    const params = [];
    if (farmer_id) { text += ' WHERE l.farmer_id=$1'; params.push(farmer_id); }
    text += ' ORDER BY l.labour_id';
    res.json((await q(text, params)).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/labour', async (req, res) => {
  const { labourCode, fullName, contact, role, dailyWage, farmerId, farmId, joinDate, status='Active' } = req.body;
  if (!labourCode||!fullName||!farmerId) return res.status(400).json({ error: 'labourCode, fullName, farmerId required' });
  try {
    const result = await q(
      `INSERT INTO labour(labour_code,full_name,contact,role,daily_wage,farmer_id,farm_id,join_date,status)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [labourCode,fullName,contact||null,role||'General',dailyWage||0,farmerId,farmId||null,joinDate||new Date().toISOString().slice(0,10),status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/labour/:id', async (req, res) => {
  const { fullName, contact, role, dailyWage, farmId, status } = req.body;
  try {
    const result = await q(
      `UPDATE labour SET full_name=$1,contact=$2,role=$3,daily_wage=$4,farm_id=$5,status=$6 WHERE labour_id=$7 RETURNING *`,
      [fullName,contact,role,dailyWage,farmId||null,status,req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/labour/:id', async (req, res) => {
  try { await q('DELETE FROM labour WHERE labour_id=$1',[req.params.id]); res.json({success:true}); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
//  FINANCE
// ============================================================
app.get('/api/finance', async (req, res) => {
  const { farmer_id } = req.query;
  try {
    let text = `SELECT fr.*,f.full_name AS farmer_name,fm.farm_code
                FROM finance_records fr
                JOIN farmers f ON f.farmer_id=fr.farmer_id
                LEFT JOIN farms fm ON fm.farm_id=fr.farm_id`;
    const params = [];
    if (farmer_id) { text += ' WHERE fr.farmer_id=$1'; params.push(farmer_id); }
    text += ' ORDER BY fr.record_date DESC,fr.finance_id DESC';
    res.json((await q(text, params)).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/finance', async (req, res) => {
  const { farmerId, farmId, type, category, amount, description, recordDate } = req.body;
  if (!farmerId||!type||!category||!amount) return res.status(400).json({ error: 'farmerId, type, category, amount required' });
  try {
    const result = await q(
      `INSERT INTO finance_records(farmer_id,farm_id,type,category,amount,description,record_date)
       VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [farmerId,farmId||null,type,category,amount,description||null,recordDate||new Date().toISOString().slice(0,10)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/finance/:id', async (req, res) => {
  const { type, category, amount, description, recordDate, farmId } = req.body;
  try {
    const result = await q(
      `UPDATE finance_records SET type=$1,category=$2,amount=$3,description=$4,record_date=$5,farm_id=$6 WHERE finance_id=$7 RETURNING *`,
      [type,category,amount,description,recordDate,farmId||null,req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/finance/:id', async (req, res) => {
  try { await q('DELETE FROM finance_records WHERE finance_id=$1',[req.params.id]); res.json({success:true}); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
//  ADMIN — Update farmer password
// ============================================================
app.patch('/api/farmers/:id/password', async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });
  try {
    const hash = await bcrypt.hash(password, 10);
    await q(`UPDATE users SET password_hash=$1 WHERE farmer_id=$2`, [hash, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`🌾 FarmIQ backend running on http://localhost:${PORT}`));
