-- ============================================================
--  Agrovision v2 — Smart Farming Database
--  PostgreSQL Schema with Auth, Reminders & Full CRUD
-- ============================================================

DROP TABLE IF EXISTS finance_records  CASCADE;
DROP TABLE IF EXISTS labour          CASCADE;
DROP TABLE IF EXISTS alerts          CASCADE;
DROP TABLE IF EXISTS sensor_data     CASCADE;
DROP TABLE IF EXISTS irrigation      CASCADE;
DROP TABLE IF EXISTS pesticides      CASCADE;
DROP TABLE IF EXISTS fertilizers     CASCADE;
DROP TABLE IF EXISTS equipment       CASCADE;
DROP TABLE IF EXISTS crops           CASCADE;
DROP TABLE IF EXISTS farms           CASCADE;
DROP TABLE IF EXISTS users           CASCADE;
DROP TABLE IF EXISTS farmers         CASCADE;

DROP FUNCTION IF EXISTS fn_avg_temperature(INT)  CASCADE;
DROP FUNCTION IF EXISTS fn_avg_moisture(INT)     CASCADE;
DROP FUNCTION IF EXISTS fn_fertilizer_usage(INT) CASCADE;
DROP FUNCTION IF EXISTS fn_crop_count(INT)       CASCADE;
DROP FUNCTION IF EXISTS trg_fn_sensor_alert()    CASCADE;
DROP FUNCTION IF EXISTS trg_fn_farm_status()     CASCADE;


-- ============================================================
--  1. FARMERS
-- ============================================================
CREATE TABLE farmers (
    farmer_id   SERIAL       PRIMARY KEY,
    farmer_code VARCHAR(10)  UNIQUE NOT NULL,
    full_name   VARCHAR(100) NOT NULL,
    contact     VARCHAR(20),
    location    VARCHAR(150),
    status      VARCHAR(10)  DEFAULT 'Active' CHECK (status IN ('Active','Inactive')),
    created_at  TIMESTAMP    DEFAULT NOW()
);

-- ============================================================
--  2. USERS (auth — one per farmer + admin accounts)
-- ============================================================
CREATE TABLE users (
    user_id     SERIAL       PRIMARY KEY,
    username    VARCHAR(50)  UNIQUE NOT NULL,
    password_hash TEXT       NOT NULL,          -- bcrypt hash
    role        VARCHAR(10)  NOT NULL CHECK (role IN ('admin','farmer')),
    farmer_id   INT          REFERENCES farmers(farmer_id) ON DELETE CASCADE,
    is_active   BOOLEAN      DEFAULT TRUE,
    created_at  TIMESTAMP    DEFAULT NOW(),
    CONSTRAINT chk_farmer_role CHECK (
        (role = 'farmer' AND farmer_id IS NOT NULL) OR
        (role = 'admin'  AND farmer_id IS NULL)
    )
);
CREATE INDEX idx_users_username ON users(username);

-- ============================================================
--  3. FARMS
-- ============================================================
CREATE TABLE farms (
    farm_id     SERIAL        PRIMARY KEY,
    farm_code   VARCHAR(10)   UNIQUE NOT NULL,
    location    VARCHAR(150)  NOT NULL,
    area_ha     NUMERIC(8,2),
    farmer_id   INT           NOT NULL REFERENCES farmers(farmer_id) ON DELETE RESTRICT,
    status      VARCHAR(20)   DEFAULT 'Active' CHECK (status IN ('Active','Inactive','Low Water','Alert')),
    created_at  TIMESTAMP     DEFAULT NOW()
);
CREATE INDEX idx_farms_farmer ON farms(farmer_id);

-- ============================================================
--  4. CROPS
-- ============================================================
CREATE TABLE crops (
    crop_id      SERIAL       PRIMARY KEY,
    crop_code    VARCHAR(10)  UNIQUE NOT NULL,
    crop_name    VARCHAR(100) NOT NULL,
    season       VARCHAR(50),
    planted_date DATE,
    harvest_date DATE,
    progress_pct SMALLINT     DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
    farm_id      INT          NOT NULL REFERENCES farms(farm_id) ON DELETE RESTRICT,
    status       VARCHAR(15)  DEFAULT 'Growing' CHECK (status IN ('Growing','Monitoring','Alert','Harvested')),
    created_at   TIMESTAMP    DEFAULT NOW()
);
CREATE INDEX idx_crops_farm ON crops(farm_id);

-- ============================================================
--  5. EQUIPMENT
-- ============================================================
CREATE TABLE equipment (
    equip_id    SERIAL        PRIMARY KEY,
    equip_code  VARCHAR(10)   UNIQUE NOT NULL,
    equip_name  VARCHAR(100)  NOT NULL,
    model       VARCHAR(100),
    farmer_id   INT           NOT NULL REFERENCES farmers(farmer_id) ON DELETE RESTRICT,
    condition   VARCHAR(20)   DEFAULT 'Good' CHECK (condition IN ('Good','Service Due','Repair Needed')),
    created_at  TIMESTAMP     DEFAULT NOW()
);
CREATE INDEX idx_equip_farmer ON equipment(farmer_id);

-- ============================================================
--  6. FERTILIZERS  (with reminder tracking)
-- ============================================================
CREATE TABLE fertilizers (
    fert_id          SERIAL        PRIMARY KEY,
    fert_name        VARCHAR(100)  NOT NULL,
    fert_type        VARCHAR(50),
    quantity_kg      NUMERIC(10,2) DEFAULT 0,
    used_kg          NUMERIC(10,2) DEFAULT 0,
    farm_id          INT           NOT NULL REFERENCES farms(farm_id) ON DELETE RESTRICT,
    last_applied     DATE,
    frequency_days   INT           DEFAULT 30,   -- how often to apply (days)
    next_due         DATE,                        -- auto-set by trigger
    created_at       TIMESTAMP     DEFAULT NOW(),
    CONSTRAINT chk_fert_qty CHECK (quantity_kg >= 0 AND used_kg >= 0)
);
CREATE INDEX idx_fert_farm ON fertilizers(farm_id);

-- ============================================================
--  7. PESTICIDES  (with reminder tracking)
-- ============================================================
CREATE TABLE pesticides (
    pest_id          SERIAL        PRIMARY KEY,
    pest_name        VARCHAR(100)  NOT NULL,
    pest_type        VARCHAR(50),
    quantity_l       NUMERIC(10,2) DEFAULT 0,
    used_l           NUMERIC(10,2) DEFAULT 0,
    farm_id          INT           NOT NULL REFERENCES farms(farm_id) ON DELETE RESTRICT,
    last_applied     DATE,
    frequency_days   INT           DEFAULT 21,
    next_due         DATE,                        -- auto-set by trigger
    created_at       TIMESTAMP     DEFAULT NOW(),
    CONSTRAINT chk_pest_qty CHECK (quantity_l >= 0)
);
CREATE INDEX idx_pest_farm ON pesticides(farm_id);

-- ============================================================
--  8. IRRIGATION  (with reminder tracking)
-- ============================================================
CREATE TABLE irrigation (
    irr_id           SERIAL        PRIMARY KEY,
    farm_id          INT           NOT NULL REFERENCES farms(farm_id) ON DELETE RESTRICT,
    irr_type         VARCHAR(50)   NOT NULL,
    water_source     VARCHAR(50),
    schedule         VARCHAR(100),
    frequency_days   INT           DEFAULT 1,
    last_irrigated   TIMESTAMP,
    next_due         TIMESTAMP,                   -- auto-set by trigger
    status           VARCHAR(15)   DEFAULT 'Active' CHECK (status IN ('Active','Paused','Overdue')),
    updated_at       TIMESTAMP     DEFAULT NOW()
);
CREATE INDEX idx_irr_farm ON irrigation(farm_id);

-- ============================================================
--  9. SENSOR DATA
-- ============================================================
CREATE TABLE sensor_data (
    sensor_id     SERIAL       PRIMARY KEY,
    sensor_code   VARCHAR(10)  NOT NULL,
    farm_id       INT          NOT NULL REFERENCES farms(farm_id) ON DELETE RESTRICT,
    location_desc VARCHAR(100),
    sensor_type   VARCHAR(20)  NOT NULL CHECK (sensor_type IN ('Moisture','Temperature')),
    reading       NUMERIC(7,2) NOT NULL,
    recorded_at   TIMESTAMP    DEFAULT NOW(),
    status        VARCHAR(10)  DEFAULT 'Normal' CHECK (status IN ('Normal','High','Low','Critical'))
);
CREATE INDEX idx_sensor_farm      ON sensor_data(farm_id);
CREATE INDEX idx_sensor_type_time ON sensor_data(sensor_type, recorded_at DESC);

-- ============================================================
--  10. ALERTS
-- ============================================================
CREATE TABLE alerts (
    alert_id    SERIAL       PRIMARY KEY,
    farm_id     INT          NOT NULL REFERENCES farms(farm_id) ON DELETE CASCADE,
    sensor_id   INT          REFERENCES sensor_data(sensor_id) ON DELETE SET NULL,
    alert_type  VARCHAR(10)  NOT NULL CHECK (alert_type IN ('Critical','Warning','Info')),
    category    VARCHAR(20)  DEFAULT 'Sensor' CHECK (category IN ('Sensor','Irrigation','Fertilizer','Pesticide')),
    message     TEXT         NOT NULL,
    is_resolved BOOLEAN      DEFAULT FALSE,
    created_at  TIMESTAMP    DEFAULT NOW()
);
CREATE INDEX idx_alerts_farm       ON alerts(farm_id);
CREATE INDEX idx_alerts_unresolved ON alerts(is_resolved) WHERE is_resolved = FALSE;


-- ============================================================
--  FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION fn_avg_temperature(p_farm_id INT)
RETURNS NUMERIC AS $$
    SELECT ROUND(AVG(reading),2) FROM sensor_data
    WHERE farm_id=p_farm_id AND sensor_type='Temperature' AND recorded_at >= NOW()-INTERVAL '24 hours';
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION fn_avg_moisture(p_farm_id INT)
RETURNS NUMERIC AS $$
    SELECT ROUND(AVG(reading),2) FROM sensor_data
    WHERE farm_id=p_farm_id AND sensor_type='Moisture' AND recorded_at >= NOW()-INTERVAL '24 hours';
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION fn_fertilizer_usage(p_farm_id INT)
RETURNS NUMERIC AS $$
    SELECT COALESCE(SUM(used_kg),0) FROM fertilizers WHERE farm_id=p_farm_id;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION fn_crop_count(p_farm_id INT)
RETURNS INT AS $$
    SELECT COUNT(*)::INT FROM crops WHERE farm_id=p_farm_id AND status!='Harvested';
$$ LANGUAGE SQL STABLE;

-- Check overdue irrigation/fertilizer/pesticide and insert alerts
CREATE OR REPLACE FUNCTION fn_check_reminders(p_farm_id INT)
RETURNS TABLE(category TEXT, message TEXT, days_overdue INT) AS $$
BEGIN
    -- Overdue irrigation
    RETURN QUERY
    SELECT 'Irrigation'::TEXT,
           'Irrigation overdue for farm - last done ' || COALESCE(TO_CHAR(last_irrigated,'DD Mon YYYY'),'never'),
           COALESCE(EXTRACT(DAY FROM NOW()-next_due)::INT, 999)
    FROM irrigation
    WHERE farm_id=p_farm_id AND status='Active'
      AND (next_due < NOW() OR last_irrigated IS NULL);

    -- Overdue fertilizer
    RETURN QUERY
    SELECT 'Fertilizer'::TEXT,
           fert_name || ' application overdue - last applied ' || COALESCE(TO_CHAR(last_applied,'DD Mon YYYY'),'never'),
           COALESCE((CURRENT_DATE - next_due)::INT, 999)
    FROM fertilizers
    WHERE farm_id=p_farm_id
      AND (next_due < CURRENT_DATE OR last_applied IS NULL);

    -- Overdue pesticide
    RETURN QUERY
    SELECT 'Pesticide'::TEXT,
           pest_name || ' application overdue - last applied ' || COALESCE(TO_CHAR(last_applied,'DD Mon YYYY'),'never'),
           COALESCE((CURRENT_DATE - next_due)::INT, 999)
    FROM pesticides
    WHERE farm_id=p_farm_id
      AND (next_due < CURRENT_DATE OR last_applied IS NULL);
END;
$$ LANGUAGE plpgsql STABLE;


-- ============================================================
--  TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION trg_fn_sensor_alert()
RETURNS TRIGGER AS $$
DECLARE v_type VARCHAR(10); v_msg TEXT;
BEGIN
    IF    NEW.sensor_type='Moisture'    AND NEW.reading < 25           THEN v_type:='Critical'; v_msg:='Moisture at '||NEW.reading||'% — below 25% threshold (farm '||NEW.farm_id||')';
    ELSIF NEW.sensor_type='Moisture'    AND NEW.reading BETWEEN 25 AND 40 THEN v_type:='Warning';  v_msg:='Moisture at '||NEW.reading||'% — moderately low (farm '||NEW.farm_id||')';
    ELSIF NEW.sensor_type='Temperature' AND NEW.reading > 32           THEN v_type:='Critical'; v_msg:='Temperature at '||NEW.reading||'°C — exceeds 32°C (farm '||NEW.farm_id||')';
    ELSIF NEW.sensor_type='Temperature' AND NEW.reading BETWEEN 30 AND 32 THEN v_type:='Warning';  v_msg:='Temperature at '||NEW.reading||'°C — approaching limit (farm '||NEW.farm_id||')';
    END IF;
    IF v_type IS NOT NULL THEN
        INSERT INTO alerts(farm_id,sensor_id,alert_type,category,message) VALUES(NEW.farm_id,NEW.sensor_id,v_type,'Sensor',v_msg);
        UPDATE sensor_data SET status=CASE WHEN v_type='Critical' THEN 'Critical' ELSE 'High' END WHERE sensor_id=NEW.sensor_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sensor_alert AFTER INSERT ON sensor_data FOR EACH ROW EXECUTE FUNCTION trg_fn_sensor_alert();

CREATE OR REPLACE FUNCTION trg_fn_farm_status()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE farms SET status=CASE WHEN EXISTS(SELECT 1 FROM alerts WHERE farm_id=NEW.farm_id AND alert_type='Critical' AND is_resolved=FALSE) THEN 'Alert' ELSE 'Active' END WHERE farm_id=NEW.farm_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_farm_status_sensor     AFTER INSERT ON sensor_data FOR EACH ROW EXECUTE FUNCTION trg_fn_farm_status();
CREATE TRIGGER trg_farm_status_irrigation AFTER INSERT OR UPDATE ON irrigation FOR EACH ROW EXECUTE FUNCTION trg_fn_farm_status();


-- ============================================================
--  NEXT_DUE TRIGGERS  (replaces GENERATED ALWAYS AS columns)
--  Reason: GENERATED columns require IMMUTABLE expressions.
--  Casting a variable column to INTERVAL is STABLE, not IMMUTABLE,
--  so PostgreSQL rejects it. Triggers have no such restriction.
-- ============================================================

-- Fertilizers: next_due = last_applied + frequency_days (DATE + INT = DATE)
CREATE OR REPLACE FUNCTION trg_fn_calc_next_due_fert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.last_applied IS NOT NULL THEN
        NEW.next_due := NEW.last_applied + NEW.frequency_days;
    ELSE
        NEW.next_due := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_fert_next_due
BEFORE INSERT OR UPDATE ON fertilizers
FOR EACH ROW EXECUTE FUNCTION trg_fn_calc_next_due_fert();


-- Pesticides: next_due = last_applied + frequency_days (DATE + INT = DATE)
CREATE OR REPLACE FUNCTION trg_fn_calc_next_due_pest()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.last_applied IS NOT NULL THEN
        NEW.next_due := NEW.last_applied + NEW.frequency_days;
    ELSE
        NEW.next_due := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pest_next_due
BEFORE INSERT OR UPDATE ON pesticides
FOR EACH ROW EXECUTE FUNCTION trg_fn_calc_next_due_pest();


-- Irrigation: next_due = last_irrigated + frequency_days (TIMESTAMP + INTERVAL)
CREATE OR REPLACE FUNCTION trg_fn_calc_next_due_irr()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.last_irrigated IS NOT NULL THEN
        NEW.next_due := NEW.last_irrigated + (NEW.frequency_days || ' days')::INTERVAL;
    ELSE
        NEW.next_due := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_irrigation_next_due
BEFORE INSERT OR UPDATE ON irrigation
FOR EACH ROW EXECUTE FUNCTION trg_fn_calc_next_due_irr();


-- ============================================================
--  SEED DATA
-- ============================================================

-- Farmers
INSERT INTO farmers(farmer_code,full_name,contact,location,status) VALUES
    ('F001','Ramesh Patel',  '+91 98765 43210','Anand, Gujarat',   'Active'),
    ('F002','Suresh Kumar',  '+91 87654 32109','Vadodara, Gujarat','Active'),
    ('F003','Mahesh Singh',  '+91 76543 21098','Surat, Gujarat',   'Inactive'),
    ('F004','Dinesh Sharma', '+91 65432 10987','Rajkot, Gujarat',  'Active');

-- Users (passwords are bcrypt hashes)
-- admin  → admin123
-- farmers → farmer123
INSERT INTO users(username,password_hash,role,farmer_id) VALUES
    ('admin',   '$2b$10$d8IqwZPDdOc1eBR4kj1hMOEAvKaV3cVA8J/NeCQkCWM087QCv8nPK', 'admin',  NULL),
    ('ramesh',  '$2b$10$Q5a40nR5Ea1X83iefr6jfea9zSVgdqE8/gEUA7qG7.nwW5xUYKqOS', 'farmer', 1),
    ('suresh',  '$2b$10$Q5a40nR5Ea1X83iefr6jfea9zSVgdqE8/gEUA7qG7.nwW5xUYKqOS', 'farmer', 2),
    ('mahesh',  '$2b$10$Q5a40nR5Ea1X83iefr6jfea9zSVgdqE8/gEUA7qG7.nwW5xUYKqOS', 'farmer', 3),
    ('dinesh',  '$2b$10$Q5a40nR5Ea1X83iefr6jfea9zSVgdqE8/gEUA7qG7.nwW5xUYKqOS', 'farmer', 4);

-- Farms
INSERT INTO farms(farm_code,location,area_ha,farmer_id) VALUES
    ('FM101','Anand, Gujarat',   12.5,1),
    ('FM102','Anand, Gujarat',    8.0,1),
    ('FM103','Vadodara, Gujarat', 6.5,2),
    ('FM104','Surat, Gujarat',    4.0,3),
    ('FM105','Rajkot, Gujarat',  18.0,4);

-- Crops
INSERT INTO crops(crop_code,crop_name,season,planted_date,harvest_date,progress_pct,farm_id,status) VALUES
    ('C001','Wheat',    'Rabi 2025',  '2024-11-01','2025-03-31',85,1,'Growing'),
    ('C002','Rice',     'Kharif 2025','2025-06-01','2025-10-31',40,2,'Growing'),
    ('C003','Cotton',   'Kharif 2025','2025-05-01','2025-11-30',55,3,'Monitoring'),
    ('C004','Sugarcane','Annual',     '2025-01-01','2026-01-31',60,4,'Growing'),
    ('C005','Soybean',  'Kharif 2025','2025-06-01','2025-09-30',70,5,'Alert');

-- Equipment
INSERT INTO equipment(equip_code,equip_name,model,farmer_id,condition) VALUES
    ('EQ001','Tractor',   'Mahindra 575 DI',1,'Good'),
    ('EQ002','Harvester', 'John Deere W330',1,'Service Due'),
    ('EQ003','Sprayer',   'Aspee HTP 16L',  2,'Good'),
    ('EQ004','Water Pump','Kirloskar 5HP',  3,'Repair Needed'),
    ('EQ005','Rotavator', 'Fieldking RMB',  4,'Good');

-- Fertilizers (last_applied in past so reminders fire)
INSERT INTO fertilizers(fert_name,fert_type,quantity_kg,used_kg,farm_id,last_applied,frequency_days) VALUES
    ('Urea',        'Nitrogen',     400,340,1,'2026-02-01',30),
    ('DAP',         'Phosphate',    600,210,2,'2026-03-01',30),
    ('MOP',         'Potash',       250,180,3,'2026-01-15',30),
    ('NPK 20-20-20','Complex',      500, 90,4,'2026-03-05',30),
    ('Zinc Sulphate','Micronutrient', 80, 65,5,'2026-02-20',21);

-- Pesticides
INSERT INTO pesticides(pest_name,pest_type,quantity_l,used_l,farm_id,last_applied,frequency_days) VALUES
    ('Chlorpyrifos','Insecticide',15,5, 1,'2026-02-15',21),
    ('Mancozeb',    'Fungicide',   8,3, 2,'2026-03-01',21),
    ('Glyphosate',  'Herbicide',  20,8, 3,'2026-01-20',21),
    ('Imidacloprid','Insecticide', 3,1, 4,'2026-02-10',21);

-- Irrigation (last_irrigated in past so reminders fire for some)
INSERT INTO irrigation(farm_id,irr_type,water_source,schedule,frequency_days,last_irrigated,status) VALUES
    (1,'Drip Irrigation','Borewell',  'Daily 6:00 AM',  1, NOW()-INTERVAL '2 days', 'Active'),
    (2,'Sprinkler',      'Canal',     'Alternate days',  2, NOW()-INTERVAL '1 day',  'Active'),
    (3,'Flood',          'River',     'Weekly',          7, NOW()-INTERVAL '9 days', 'Active'),
    (4,'Drip Irrigation','Borewell',  'Daily 7:00 AM',   1, NOW()-INTERVAL '6 hours','Active'),
    (5,'Micro-sprinkler','Reservoir', 'Daily 5:00 AM',   1, NULL,                    'Paused');

-- Sensor data (triggers alerts automatically)
INSERT INTO sensor_data(sensor_code,farm_id,location_desc,sensor_type,reading) VALUES
    ('S001',1,'Field A',   'Moisture',   72),
    ('S002',1,'Greenhouse','Temperature',27),
    ('S003',2,'Field B',   'Temperature',34),
    ('S004',3,'Field C',   'Moisture',   18),
    ('S005',4,'Main Field','Moisture',   65),
    ('S006',5,'Main Field','Temperature',29);

-- ============================================================
--  11. LABOUR
-- ============================================================
CREATE TABLE labour (
    labour_id    SERIAL        PRIMARY KEY,
    labour_code  VARCHAR(10)   UNIQUE NOT NULL,
    full_name    VARCHAR(100)  NOT NULL,
    contact      VARCHAR(20),
    role         VARCHAR(50)   NOT NULL DEFAULT 'General',
    daily_wage   NUMERIC(10,2) DEFAULT 0,
    farmer_id    INT           NOT NULL REFERENCES farmers(farmer_id) ON DELETE RESTRICT,
    farm_id      INT           REFERENCES farms(farm_id) ON DELETE SET NULL,
    join_date    DATE          DEFAULT CURRENT_DATE,
    status       VARCHAR(10)   DEFAULT 'Active' CHECK (status IN ('Active','Inactive')),
    created_at   TIMESTAMP     DEFAULT NOW()
);
CREATE INDEX idx_labour_farmer ON labour(farmer_id);

-- ============================================================
--  12. FINANCE RECORDS
-- ============================================================
CREATE TABLE finance_records (
    finance_id   SERIAL        PRIMARY KEY,
    farmer_id    INT           NOT NULL REFERENCES farmers(farmer_id) ON DELETE RESTRICT,
    farm_id      INT           REFERENCES farms(farm_id) ON DELETE SET NULL,
    type         VARCHAR(10)   NOT NULL CHECK (type IN ('Income','Expense')),
    category     VARCHAR(50)   NOT NULL,
    amount       NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    description  TEXT,
    record_date  DATE          DEFAULT CURRENT_DATE,
    created_at   TIMESTAMP     DEFAULT NOW()
);
CREATE INDEX idx_finance_farmer ON finance_records(farmer_id);
CREATE INDEX idx_finance_date   ON finance_records(record_date DESC);

-- Seed Labour
INSERT INTO labour(labour_code,full_name,contact,role,daily_wage,farmer_id,farm_id,join_date,status) VALUES
    ('L001','Raju Verma',   '+91 91234 56789','Harvesting',  500,1,1,'2025-10-01','Active'),
    ('L002','Sita Devi',    '+91 92345 67890','Irrigation',  400,1,2,'2025-11-01','Active'),
    ('L003','Mohan Lal',    '+91 93456 78901','Spraying',    450,2,3,'2025-09-15','Active'),
    ('L004','Geeta Bai',    '+91 94567 89012','Planting',    380,3,4,'2026-01-10','Inactive'),
    ('L005','Sunil Yadav',  '+91 95678 90123','General',     420,4,5,'2025-12-01','Active');

-- Seed Finance
INSERT INTO finance_records(farmer_id,farm_id,type,category,amount,description,record_date) VALUES
    (1,1,'Income', 'Crop Sale',   85000,'Wheat sale to mandi',       '2025-04-01'),
    (1,1,'Expense','Fertilizer',   4500,'Urea purchase',             '2026-02-01'),
    (1,2,'Expense','Labour',       9000,'Harvesting labour - 18 days','2025-03-20'),
    (2,3,'Income', 'Crop Sale',   62000,'Cotton sale',               '2025-12-10'),
    (2,3,'Expense','Pesticide',    3200,'Mancozeb purchase',         '2026-03-01'),
    (3,4,'Expense','Equipment',   12000,'Water pump repair',         '2026-01-05'),
    (4,5,'Income', 'Crop Sale',   95000,'Soybean sale',              '2025-10-15'),
    (4,5,'Expense','Irrigation',   2800,'Drip pipe replacement',     '2026-02-20');
