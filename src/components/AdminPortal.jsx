// Agrovision v2 — Admin Portal
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import {
  Card, CardHeader, Table, Badge, MetricCard, AlertItem,
  Modal, ModalFooter, Field, Input, Select, FormGrid,
  Sidebar, Topbar, Btn, Toast, useToast, ReminderBadge
} from './Shared';

const NAV = [
  { id: 'dashboard',  icon: '📊', label: 'Dashboard' },
  { id: 'farmers',    icon: '👨‍🌾', label: 'Farmers' },
  { id: 'farms',      icon: '🏡', label: 'Farms' },
  { id: 'crops',      icon: '🌱', label: 'Crops' },
  { id: 'equipment',  icon: '⚙️',  label: 'Equipment' },
  { id: 'resources',  icon: '🧪', label: 'Resources' },
  { id: 'labour',     icon: '👷', label: 'Labour' },
  { id: 'finance',    icon: '💰', label: 'Finance' },
  { id: 'sensors',    icon: '📡', label: 'Sensors' },
  { id: 'irrigation', icon: '💧', label: 'Irrigation' },
];

const TITLES = {
  dashboard: 'Dashboard', farmers: 'Farmer Management', farms: 'Farm Management',
  crops: 'Crop Overview', equipment: 'Equipment', resources: 'Resources',
  labour: 'Labour Management', finance: 'Finance', sensors: 'Sensor Data',
  irrigation: 'Irrigation',
};

export default function AdminPortal({ user, onLogout }) {
  const [nav, setNav]           = useState('dashboard');
  const [loading, setLoading]   = useState(false);
  const [toast, showToast]      = useToast();

  // Data state
  const [dash, setDash]         = useState(null);
  const [alerts, setAlerts]     = useState([]);
  const [farmers, setFarmers]   = useState([]);
  const [farms, setFarms]       = useState([]);
  const [crops, setCrops]       = useState([]);
  const [equipment, setEquip]   = useState([]);
  const [fertilizers, setFerts] = useState([]);
  const [pesticides, setPests]  = useState([]);
  const [labour, setLabour]     = useState([]);
  const [finance, setFinance]   = useState([]);
  const [sensors, setSensors]   = useState([]);
  const [irrigation, setIrrig]  = useState([]);

  // Badge counts
  const fertOverdue  = fertilizers.filter(f => f.is_overdue).length;
  const pestOverdue  = pesticides.filter(p => p.is_overdue).length;
  const irrigOverdue = irrigation.filter(i => i.is_overdue).length;
  const totalAlerts  = alerts.length;

  const navItems = NAV.map(n => ({
    ...n,
    badge: n.id === 'resources'  ? fertOverdue + pestOverdue
         : n.id === 'irrigation' ? irrigOverdue
         : n.id === 'dashboard'  ? totalAlerts
         : 0,
  }));

  // ── Loaders ──────────────────────────────────────────────────────────────────
  const loadDash      = useCallback(() => api.dashboard().then(d => { setDash(d); }).catch(() => {}), []);
  const loadAlerts    = useCallback(() => api.getAlerts().then(setAlerts).catch(() => {}), []);
  const loadFarmers   = useCallback(() => api.getFarmers().then(setFarmers).catch(() => {}), []);
  const loadFarms     = useCallback(() => api.getFarms().then(setFarms).catch(() => {}), []);
  const loadCrops     = useCallback(() => api.getCrops().then(setCrops).catch(() => {}), []);
  const loadEquip     = useCallback(() => api.getEquipment().then(setEquip).catch(() => {}), []);
  const loadFerts     = useCallback(() => api.getFertilizers().then(setFerts).catch(() => {}), []);
  const loadPests     = useCallback(() => api.getPesticides().then(setPests).catch(() => {}), []);
  const loadLabour    = useCallback(() => api.getLabour().then(setLabour).catch(() => {}), []);
  const loadFinance   = useCallback(() => api.getFinance().then(setFinance).catch(() => {}), []);
  const loadSensors   = useCallback(() => api.getSensors().then(setSensors).catch(() => {}), []);
  const loadIrrigation= useCallback(() => api.getIrrigation().then(setIrrig).catch(() => {}), []);

  useEffect(() => { loadDash(); loadAlerts(); }, []);

  useEffect(() => {
    if (nav === 'farmers')    loadFarmers();
    if (nav === 'farms')      { loadFarms(); loadFarmers(); }
    if (nav === 'crops')      loadCrops();
    if (nav === 'equipment')  loadEquip();
    if (nav === 'resources')  { loadFerts(); loadPests(); loadFarms(); }
    if (nav === 'labour')     { loadLabour(); loadFarmers(); loadFarms(); }
    if (nav === 'finance')    { loadFinance(); loadFarmers(); loadFarms(); }
    if (nav === 'sensors')    loadSensors();
    if (nav === 'irrigation') loadIrrigation();
  }, [nav]);

  // ── Sections ─────────────────────────────────────────────────────────────────
  const section = {
    dashboard:  <DashboardSection  dash={dash} alerts={alerts} setAlerts={setAlerts} showToast={showToast} />,
    farmers:    <FarmersSection    farmers={farmers} setFarmers={setFarmers} setLoading={setLoading} loading={loading} showToast={showToast} reload={loadFarmers} />,
    farms:      <FarmsSection      farms={farms} setFarms={setFarms} farmers={farmers} setLoading={setLoading} loading={loading} showToast={showToast} reload={loadFarms} />,
    crops:      <CropsSection      crops={crops} />,
    equipment:  <EquipmentSection  equipment={equipment} setEquip={setEquip} setLoading={setLoading} loading={loading} showToast={showToast} reload={loadEquip} />,
    resources:  <ResourcesSection  fertilizers={fertilizers} setFerts={setFerts} pesticides={pesticides} setPests={setPests} farms={farms} setLoading={setLoading} loading={loading} showToast={showToast} reload={() => { loadFerts(); loadPests(); }} />,
    labour:     <LabourSection     labour={labour} setLabour={setLabour} farmers={farmers} farms={farms} setLoading={setLoading} loading={loading} showToast={showToast} reload={loadLabour} />,
    finance:    <FinanceSection    finance={finance} setFinance={setFinance} farmers={farmers} farms={farms} setLoading={setLoading} loading={loading} showToast={showToast} reload={loadFinance} />,
    sensors:    <SensorsSection    sensors={sensors} />,
    irrigation: <IrrigationSection irrigation={irrigation} />,
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif', background: '#eeede9' }}>
      <Sidebar navItems={navItems} activeNav={nav} onNav={setNav} onLogout={onLogout} subtitle="Admin Portal" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar title={TITLES[nav]} userName="Administrator" initials="AD" isAdmin />
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {section[nav]}
        </div>
      </div>
      <Toast message={toast?.msg} type={toast?.type} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
function DashboardSection({ dash, alerts, setAlerts, showToast }) {
  const handleResolve = async (id) => {
    try {
      await api.resolveAlert(id);
      setAlerts(prev => prev.filter(a => a.alert_id !== id));
      showToast('Alert resolved');
    } catch { showToast('Failed to resolve alert', 'error'); }
  };

  const metrics = dash ? [
    { label: 'Total Farmers',      value: dash.total_farmers      ?? 0 },
    { label: 'Total Farms',        value: dash.total_farms        ?? 0 },
    { label: 'Active Crops',       value: dash.total_crops        ?? 0 },
    { label: 'Open Alerts',        value: dash.total_alerts       ?? 0, color: '#A32D2D' },
    { label: 'Irrigation Overdue', value: dash.irrigation_overdue ?? 0, color: '#BA7517' },
    { label: 'Fertilizer Overdue', value: dash.fertilizer_overdue ?? 0, color: '#BA7517' },
  ] : [];

  return (
    <>
      {metrics.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
          {metrics.map(m => <MetricCard key={m.label} label={m.label} value={m.value} valueColor={m.color} />)}
        </div>
      )}
      <Card>
        <CardHeader title={`Active Alerts (${alerts.length})`} />
        {alerts.length === 0
          ? <AlertItem type="green" title="No active alerts" desc="All systems normal" />
          : alerts.map(a => (
            <AlertItem
              key={a.alert_id}
              type={a.alert_type === 'Critical' ? 'red' : 'amber'}
              title={a.message}
              desc={`Farm: ${a.farm_code} | Category: ${a.category}`}
              time={a.created_at ? new Date(a.created_at).toLocaleString() : undefined}
              onResolve={() => handleResolve(a.alert_id)}
            />
          ))}
      </Card>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  FARMERS
// ═══════════════════════════════════════════════════════════════════════════════
function FarmersSection({ farmers, setFarmers, setLoading, loading, showToast, reload }) {
  const [showAdd, setShowAdd]       = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this farmer?')) return;
    try {
      setLoading(true);
      await api.deleteFarmer(id);
      setFarmers(prev => prev.filter(f => f.farmer_id !== id));
      showToast('Farmer deleted');
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const rows = farmers.map(f => [
    f.farmer_code,
    f.full_name,
    f.username || '—',
    f.contact  || '—',
    f.location || '—',
    <Badge label={f.status || 'Active'} />,
    <div style={{ display: 'flex', gap: 6 }}>
      <Btn small onClick={() => setEditTarget(f)}>Edit</Btn>
      <Btn small variant="default" onClick={() => setResetTarget(f)}>Reset Pwd</Btn>
      <Btn small variant="danger" onClick={() => handleDelete(f.farmer_id)}>Delete</Btn>
    </div>,
  ]);

  return (
    <>
      <Card>
        <CardHeader title="Farmers" right={<Btn variant="primary" small onClick={() => setShowAdd(true)}>+ Add Farmer</Btn>} />
        <Table
          headers={['Code', 'Name', 'Username', 'Contact', 'Location', 'Status', 'Actions']}
          rows={rows}
        />
      </Card>

      {showAdd && (
        <AddFarmerModal
          onClose={() => setShowAdd(false)}
          onSaved={(f) => { setFarmers(prev => [...prev, f]); setShowAdd(false); showToast('Farmer added'); }}
          setLoading={setLoading} loading={loading}
        />
      )}
      {editTarget && (
        <EditFarmerModal
          farmer={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) => { setFarmers(prev => prev.map(f => f.farmer_id === updated.farmer_id ? updated : f)); setEditTarget(null); showToast('Farmer updated'); }}
          setLoading={setLoading} loading={loading}
        />
      )}
      {resetTarget && (
        <ResetPasswordModal
          farmer={resetTarget}
          onClose={() => setResetTarget(null)}
          showToast={showToast}
          setLoading={setLoading} loading={loading}
        />
      )}
    </>
  );
}

function AddFarmerModal({ onClose, onSaved, setLoading, loading }) {
  const [farmerCode, setFarmerCode] = useState('');
  const [fullName, setFullName]     = useState('');
  const [username, setUsername]     = useState('');
  const [contact, setContact]       = useState('');
  const [location, setLocation]     = useState('');
  const [password, setPassword]     = useState('');
  const [status, setStatus]         = useState('Active');

  const save = async () => {
    if (!farmerCode || !fullName || !username || !password) return alert('Fill required fields');
    try {
      setLoading(true);
      const res = await api.addFarmer({ farmerCode, fullName, contact, location, password, status, username });
      onSaved(res.farmer || res);
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Add Farmer" onClose={onClose} width={500}>
      <FormGrid>
        <Field label="Farmer Code *"><Input value={farmerCode} onChange={setFarmerCode} placeholder="F005" /></Field>
        <Field label="Full Name *"><Input value={fullName} onChange={setFullName} placeholder="Jane Doe" /></Field>
        <Field label="Username *"><Input value={username} onChange={setUsername} placeholder="jdoe" /></Field>
        <Field label="Password *"><Input value={password} onChange={setPassword} type="password" placeholder="Initial password" /></Field>
        <Field label="Contact"><Input value={contact} onChange={setContact} placeholder="+91 XXXXX XXXXX" /></Field>
        <Field label="Location"><Input value={location} onChange={setLocation} placeholder="City, State" /></Field>
      </FormGrid>
      <Field label="Status">
        <Select value={status} onChange={setStatus} options={['Active', 'Inactive']} />
      </Field>
      <ModalFooter onCancel={onClose} onSave={save} loading={loading} />
    </Modal>
  );
}

function EditFarmerModal({ farmer, onClose, onSaved, setLoading, loading }) {
  const [fullName, setFullName] = useState(farmer.full_name || '');
  const [contact, setContact]   = useState(farmer.contact   || '');
  const [location, setLocation] = useState(farmer.location  || '');
  const [status, setStatus]     = useState(farmer.status    || 'Active');

  const save = async () => {
    try {
      setLoading(true);
      const res = await api.updateFarmer(farmer.farmer_id, { fullName, contact, location, status });
      onSaved({ ...farmer, full_name: fullName, contact, location, status });
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Edit Farmer" onClose={onClose} width={500}>
      <FormGrid>
        <Field label="Full Name"><Input value={fullName} onChange={setFullName} /></Field>
        <Field label="Contact"><Input value={contact} onChange={setContact} /></Field>
        <Field label="Location"><Input value={location} onChange={setLocation} /></Field>
        <Field label="Status">
          <Select value={status} onChange={setStatus} options={['Active', 'Inactive']} />
        </Field>
      </FormGrid>
      <ModalFooter onCancel={onClose} onSave={save} loading={loading} />
    </Modal>
  );
}

function ResetPasswordModal({ farmer, onClose, showToast, setLoading, loading }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');

  const save = async () => {
    if (!password) return;
    if (password !== confirm) { alert('Passwords do not match'); return; }
    try {
      setLoading(true);
      await api.resetFarmerPassword(farmer.farmer_id, password);
      showToast('Password reset successfully');
      onClose();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  return (
    <Modal title={`Reset Password — ${farmer.full_name}`} onClose={onClose} width={420}>
      <Field label="New Password"><Input value={password} onChange={setPassword} type="password" placeholder="New password" /></Field>
      <Field label="Confirm Password"><Input value={confirm} onChange={setConfirm} type="password" placeholder="Repeat password" /></Field>
      <ModalFooter onCancel={onClose} onSave={save} saveLabel="Reset" loading={loading} />
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  FARMS
// ═══════════════════════════════════════════════════════════════════════════════
function FarmsSection({ farms, setFarms, farmers, setLoading, loading, showToast, reload }) {
  const [showAdd, setShowAdd]       = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const rows = farms.map(f => [
    f.farm_code,
    f.farmer_name || f.farmer_id,
    f.location,
    f.area_ha != null ? `${f.area_ha} ha` : '—',
    <Badge label={f.status || 'Active'} />,
    <Btn small onClick={() => setEditTarget(f)}>Edit</Btn>,
  ]);

  return (
    <>
      <Card>
        <CardHeader title="Farms" right={<Btn variant="primary" small onClick={() => setShowAdd(true)}>+ Add Farm</Btn>} />
        <Table
          headers={['Farm Code', 'Farmer', 'Location', 'Area', 'Status', 'Actions']}
          rows={rows}
        />
      </Card>

      {showAdd && (
        <AddFarmModal
          farmers={farmers}
          onClose={() => setShowAdd(false)}
          onSaved={(f) => { setFarms(prev => [...prev, f]); setShowAdd(false); showToast('Farm added'); }}
          setLoading={setLoading} loading={loading}
        />
      )}
      {editTarget && (
        <EditFarmModal
          farm={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) => { setFarms(prev => prev.map(f => f.farm_id === updated.farm_id ? updated : f)); setEditTarget(null); showToast('Farm updated'); }}
          setLoading={setLoading} loading={loading}
        />
      )}
    </>
  );
}

function AddFarmModal({ farmers, onClose, onSaved, setLoading, loading }) {
  const [farmCode, setFarmCode] = useState('');
  const [location, setLocation] = useState('');
  const [areaHa, setAreaHa]     = useState('');
  const [farmerId, setFarmerId] = useState(farmers[0]?.farmer_id || '');

  const farmerOpts = farmers.map(f => ({ value: f.farmer_id, label: f.full_name }));

  const save = async () => {
    if (!farmCode || !farmerId) return alert('Fill required fields');
    try {
      setLoading(true);
      const res = await api.addFarm({ farmCode, location, areaHa: areaHa ? parseFloat(areaHa) : null, farmerId });
      onSaved(res);
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Add Farm" onClose={onClose} width={500}>
      <FormGrid>
        <Field label="Farm Code *"><Input value={farmCode} onChange={setFarmCode} placeholder="FM106" /></Field>
        <Field label="Farmer *">
          <Select value={farmerId} onChange={setFarmerId} options={farmerOpts} />
        </Field>
        <Field label="Location"><Input value={location} onChange={setLocation} placeholder="City, State" /></Field>
        <Field label="Area (ha)"><Input value={areaHa} onChange={setAreaHa} type="number" placeholder="5.0" /></Field>
      </FormGrid>
      <ModalFooter onCancel={onClose} onSave={save} loading={loading} />
    </Modal>
  );
}

function EditFarmModal({ farm, onClose, onSaved, setLoading, loading }) {
  const [location, setLocation] = useState(farm.location || '');
  const [areaHa, setAreaHa]     = useState(farm.area_ha  ?? '');
  const [status, setStatus]     = useState(farm.status   || 'Active');

  const save = async () => {
    try {
      setLoading(true);
      await api.updateFarm(farm.farm_id, { location, areaHa: areaHa ? parseFloat(areaHa) : null, status });
      onSaved({ ...farm, location, area_ha: areaHa, status });
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal title={`Edit Farm — ${farm.farm_code}`} onClose={onClose} width={460}>
      <Field label="Location"><Input value={location} onChange={setLocation} /></Field>
      <FormGrid>
        <Field label="Area (ha)"><Input value={areaHa} onChange={setAreaHa} type="number" /></Field>
        <Field label="Status">
          <Select value={status} onChange={setStatus} options={['Active', 'Inactive', 'Low Water', 'Alert']} />
        </Field>
      </FormGrid>
      <ModalFooter onCancel={onClose} onSave={save} loading={loading} />
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CROPS  (view-only, status auto-derived)
// ═══════════════════════════════════════════════════════════════════════════════
function CropsSection({ crops }) {
  const rows = crops.map(c => [
    c.crop_code,
    c.crop_name,
    c.farm_code,
    c.farmer_name,
    c.planted_date?.slice(0,10) || '—',
    c.harvest_date?.slice(0,10) || '—',
    <Badge label={c.status} />,
  ]);

  return (
    <Card>
      <CardHeader title="Crops" />
      <Table headers={['Code','Crop','Farm','Farmer','Planted','Harvest','Status']} rows={rows} />
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  EQUIPMENT
// ═══════════════════════════════════════════════════════════════════════════════
function EquipmentSection({ equipment, setEquip, setLoading, loading, showToast, reload }) {
  const [showAdd, setShowAdd]       = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this equipment?')) return;
    try {
      setLoading(true);
      await api.deleteEquipment(id);
      setEquip(prev => prev.filter(e => e.equip_id !== id));
      showToast('Equipment deleted');
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const rows = equipment.map(e => [
    e.equip_code,
    e.equip_name,
    e.model || '—',
    e.farmer_name || '—',
    <Badge label={e.condition || 'Good'} />,
    <div style={{ display: 'flex', gap: 6 }}>
      <Btn small onClick={() => setEditTarget(e)}>Edit</Btn>
      <Btn small variant="danger" onClick={() => handleDelete(e.equip_id)}>Delete</Btn>
    </div>,
  ]);

  return (
    <>
      <Card>
        <CardHeader title="Equipment" right={<Btn variant="primary" small onClick={() => setShowAdd(true)}>+ Add Equipment</Btn>} />
        <Table
          headers={['Code', 'Name', 'Model', 'Farmer', 'Condition', 'Actions']}
          rows={rows}
        />
      </Card>

      {showAdd && (
        <AddEquipmentModal
          onClose={() => setShowAdd(false)}
          onSaved={(e) => { setEquip(prev => [...prev, e]); setShowAdd(false); showToast('Equipment added'); }}
          setLoading={setLoading} loading={loading}
        />
      )}
      {editTarget && (
        <EditEquipmentModal
          equip={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) => { setEquip(prev => prev.map(e => e.equip_id === updated.equip_id ? updated : e)); setEditTarget(null); showToast('Equipment updated'); }}
          setLoading={setLoading} loading={loading}
        />
      )}
    </>
  );
}

function AddEquipmentModal({ onClose, onSaved, setLoading, loading }) {
  const [equipCode, setEquipCode] = useState('');
  const [equipName, setEquipName] = useState('');
  const [model, setModel]         = useState('');
  const [condition, setCondition] = useState('Good');

  const save = async () => {
    if (!equipCode || !equipName) return alert('Fill required fields');
    try {
      setLoading(true);
      const res = await api.addEquipment({ equipCode, equipName, model, condition });
      onSaved(res);
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Add Equipment" onClose={onClose} width={460}>
      <FormGrid>
        <Field label="Equipment Code *"><Input value={equipCode} onChange={setEquipCode} placeholder="EQ006" /></Field>
        <Field label="Equipment Name *"><Input value={equipName} onChange={setEquipName} placeholder="Tractor, Pump…" /></Field>
        <Field label="Model"><Input value={model} onChange={setModel} placeholder="Model / Serial" /></Field>
        <Field label="Condition">
          <Select value={condition} onChange={setCondition} options={['Good', 'Service Due', 'Repair Needed']} />
        </Field>
      </FormGrid>
      <ModalFooter onCancel={onClose} onSave={save} loading={loading} />
    </Modal>
  );
}

function EditEquipmentModal({ equip, onClose, onSaved, setLoading, loading }) {
  const [equipName, setEquipName] = useState(equip.equip_name || '');
  const [model, setModel]         = useState(equip.model      || '');
  const [condition, setCondition] = useState(equip.condition  || 'Good');

  const save = async () => {
    try {
      setLoading(true);
      await api.updateEquipment(equip.equip_id, { equipName, model, condition });
      onSaved({ ...equip, equip_name: equipName, model, condition });
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Edit Equipment" onClose={onClose} width={460}>
      <Field label="Equipment Name"><Input value={equipName} onChange={setEquipName} /></Field>
      <FormGrid>
        <Field label="Model"><Input value={model} onChange={setModel} /></Field>
        <Field label="Condition">
          <Select value={condition} onChange={setCondition} options={['Good', 'Service Due', 'Repair Needed']} />
        </Field>
      </FormGrid>
      <ModalFooter onCancel={onClose} onSave={save} loading={loading} />
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  RESOURCES  — Fertilizers + Pesticides with full Add / Edit / Delete
// ═══════════════════════════════════════════════════════════════════════════════
function ResourcesSection({ fertilizers, setFerts, pesticides, setPests, farms, setLoading, loading, showToast, reload }) {
  const [modal, setModal] = useState(null);
  // modal: null | {type:'add-fert'} | {type:'edit-fert',item} | {type:'add-pest'} | {type:'edit-pest',item}

  const deleteFert = async (id) => {
    if (!window.confirm('Delete this fertilizer?')) return;
    try { setLoading(true); await api.deleteFertilizer(id); setFerts(p => p.filter(f => f.fert_id !== id)); showToast('Fertilizer deleted'); }
    catch (e) { showToast(e.message, 'error'); } finally { setLoading(false); }
  };

  const deletePest = async (id) => {
    if (!window.confirm('Delete this pesticide?')) return;
    try { setLoading(true); await api.deletePesticide(id); setPests(p => p.filter(p2 => p2.pest_id !== id)); showToast('Pesticide deleted'); }
    catch (e) { showToast(e.message, 'error'); } finally { setLoading(false); }
  };

  const fertRows = fertilizers.map(f => [
    f.fert_name,
    f.fert_type || '—',
    f.farm_code,
    f.last_applied?.slice(0,10) || 'Never',
    f.next_due?.slice(0,10) || '—',
    `${f.quantity_kg} kg`,
    `${f.used_kg} kg`,
    <Badge label={f.is_overdue ? 'Overdue' : 'OK'} />,
    <div style={{ display:'flex', gap:5 }}>
      <Btn small onClick={() => setModal({ type:'edit-fert', item:f })}>Edit</Btn>
      <Btn small variant="danger" onClick={() => deleteFert(f.fert_id)}>Delete</Btn>
    </div>,
  ]);

  const pestRows = pesticides.map(p => [
    p.pest_name,
    p.pest_type || '—',
    p.farm_code,
    p.last_applied?.slice(0,10) || 'Never',
    p.next_due?.slice(0,10) || '—',
    `${p.quantity_l} L`,
    `${p.used_l || 0} L`,
    <Badge label={p.is_overdue ? 'Overdue' : 'OK'} />,
    <div style={{ display:'flex', gap:5 }}>
      <Btn small onClick={() => setModal({ type:'edit-pest', item:p })}>Edit</Btn>
      <Btn small variant="danger" onClick={() => deletePest(p.pest_id)}>Delete</Btn>
    </div>,
  ]);

  return (
    <>
      {/* Fertilizers */}
      <Card>
        <CardHeader
          title="🌿 Fertilizers"
          right={
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              {fertilizers.filter(f=>f.is_overdue).length > 0 && <Badge label={`${fertilizers.filter(f=>f.is_overdue).length} overdue`} />}
              <Btn variant="primary" small onClick={() => setModal({ type:'add-fert' })}>+ Add Fertilizer</Btn>
            </div>
          }
        />
        <Table
          headers={['Name','Type','Farm','Last Applied','Next Due','Stock','Used','Status','Actions']}
          rows={fertRows}
        />
      </Card>

      {/* Pesticides */}
      <Card>
        <CardHeader
          title="🛡️ Pesticides"
          right={
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              {pesticides.filter(p=>p.is_overdue).length > 0 && <Badge label={`${pesticides.filter(p=>p.is_overdue).length} overdue`} />}
              <Btn variant="primary" small onClick={() => setModal({ type:'add-pest' })}>+ Add Pesticide</Btn>
            </div>
          }
        />
        <Table
          headers={['Name','Type','Farm','Last Applied','Next Due','Stock','Used','Status','Actions']}
          rows={pestRows}
        />
      </Card>

      {/* Modals */}
      {modal?.type === 'add-fert' && (
        <AddFertModal farms={farms} onClose={() => setModal(null)}
          onSaved={r => { setFerts(p => [...p, r]); setModal(null); showToast('Fertilizer added'); }}
          setLoading={setLoading} loading={loading} />
      )}
      {modal?.type === 'edit-fert' && (
        <EditFertModal item={modal.item} farms={farms} onClose={() => setModal(null)}
          onSaved={r => { setFerts(p => p.map(x => x.fert_id === r.fert_id ? r : x)); setModal(null); showToast('Fertilizer updated'); }}
          setLoading={setLoading} loading={loading} />
      )}
      {modal?.type === 'add-pest' && (
        <AddPestModal farms={farms} onClose={() => setModal(null)}
          onSaved={r => { setPests(p => [...p, r]); setModal(null); showToast('Pesticide added'); }}
          setLoading={setLoading} loading={loading} />
      )}
      {modal?.type === 'edit-pest' && (
        <EditPestModal item={modal.item} farms={farms} onClose={() => setModal(null)}
          onSaved={r => { setPests(p => p.map(x => x.pest_id === r.pest_id ? r : x)); setModal(null); showToast('Pesticide updated'); }}
          setLoading={setLoading} loading={loading} />
      )}
    </>
  );
}

function AddFertModal({ farms, onClose, onSaved, setLoading, loading }) {
  const [fertName, setFertName]         = useState('');
  const [fertType, setFertType]         = useState('');
  const [quantityKg, setQuantityKg]     = useState('');
  const [farmId, setFarmId]             = useState(farms[0]?.farm_id || '');
  const [lastApplied, setLastApplied]   = useState('');
  const [frequencyDays, setFreqDays]    = useState('30');

  const farmOpts = farms.map(f => ({ value: f.farm_id, label: `${f.farm_code} — ${f.location}` }));

  const save = async () => {
    if (!fertName || !farmId || !quantityKg) return showToast?.('Fill required fields', 'error') || alert('Fill required fields');
    try {
      setLoading(true);
      const res = await api.addFertilizer({ fertName, fertType, quantityKg: parseFloat(quantityKg), farmId, lastApplied: lastApplied || null, frequencyDays: parseInt(frequencyDays) });
      onSaved(res);
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  return (
    <Modal title="Add Fertilizer" onClose={onClose} width={520}>
      <FormGrid>
        <Field label="Name *"><Input value={fertName} onChange={setFertName} placeholder="e.g. Urea" /></Field>
        <Field label="Type"><Input value={fertType} onChange={setFertType} placeholder="Nitrogen, Phosphate…" /></Field>
        <Field label="Quantity (kg) *"><Input type="number" value={quantityKg} onChange={setQuantityKg} placeholder="500" /></Field>
        <Field label="Frequency (days)"><Input type="number" value={frequencyDays} onChange={setFreqDays} placeholder="30" /></Field>
        <Field label="Farm *"><Select value={farmId} onChange={setFarmId} options={farmOpts} /></Field>
        <Field label="Last Applied"><Input type="date" value={lastApplied} onChange={setLastApplied} /></Field>
      </FormGrid>
      <ModalFooter onCancel={onClose} onSave={save} loading={loading} />
    </Modal>
  );
}

function EditFertModal({ item, farms, onClose, onSaved, setLoading, loading }) {
  const [fertName, setFertName]       = useState(item.fert_name || '');
  const [fertType, setFertType]       = useState(item.fert_type || '');
  const [quantityKg, setQuantityKg]   = useState(item.quantity_kg ?? '');
  const [farmId, setFarmId]           = useState(item.farm_id || farms[0]?.farm_id || '');
  const [lastApplied, setLastApplied] = useState(item.last_applied?.slice(0,10) || '');
  const [frequencyDays, setFreqDays]  = useState(item.frequency_days ?? 30);

  const farmOpts = farms.map(f => ({ value: f.farm_id, label: `${f.farm_code} — ${f.location}` }));

  const save = async () => {
    try {
      setLoading(true);
      const res = await api.updateFertilizer(item.fert_id, { fertName, fertType, quantityKg: parseFloat(quantityKg), farmId, lastApplied: lastApplied || null, frequencyDays: parseInt(frequencyDays) });
      onSaved({ ...item, fert_name: fertName, fert_type: fertType, quantity_kg: quantityKg, farm_id: farmId, last_applied: lastApplied, frequency_days: frequencyDays });
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  return (
    <Modal title={`Edit Fertilizer — ${item.fert_name}`} onClose={onClose} width={520}>
      <FormGrid>
        <Field label="Name"><Input value={fertName} onChange={setFertName} /></Field>
        <Field label="Type"><Input value={fertType} onChange={setFertType} /></Field>
        <Field label="Quantity (kg)"><Input type="number" value={quantityKg} onChange={setQuantityKg} /></Field>
        <Field label="Frequency (days)"><Input type="number" value={frequencyDays} onChange={setFreqDays} /></Field>
        <Field label="Farm"><Select value={farmId} onChange={setFarmId} options={farmOpts} /></Field>
        <Field label="Last Applied"><Input type="date" value={lastApplied} onChange={setLastApplied} /></Field>
      </FormGrid>
      <ModalFooter onCancel={onClose} onSave={save} loading={loading} />
    </Modal>
  );
}

function AddPestModal({ farms, onClose, onSaved, setLoading, loading }) {
  const [pestName, setPestName]       = useState('');
  const [pestType, setPestType]       = useState('');
  const [quantityL, setQuantityL]     = useState('');
  const [farmId, setFarmId]           = useState(farms[0]?.farm_id || '');
  const [lastApplied, setLastApplied] = useState('');
  const [frequencyDays, setFreqDays]  = useState('21');

  const farmOpts = farms.map(f => ({ value: f.farm_id, label: `${f.farm_code} — ${f.location}` }));

  const save = async () => {
    if (!pestName || !farmId || !quantityL) return alert('Fill required fields');
    try {
      setLoading(true);
      const res = await api.addPesticide({ pestName, pestType, quantityL: parseFloat(quantityL), farmId, lastApplied: lastApplied || null, frequencyDays: parseInt(frequencyDays) });
      onSaved(res);
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  return (
    <Modal title="Add Pesticide" onClose={onClose} width={520}>
      <FormGrid>
        <Field label="Name *"><Input value={pestName} onChange={setPestName} placeholder="e.g. Chlorpyrifos" /></Field>
        <Field label="Type"><Input value={pestType} onChange={setPestType} placeholder="Insecticide, Fungicide…" /></Field>
        <Field label="Quantity (L) *"><Input type="number" value={quantityL} onChange={setQuantityL} placeholder="20" /></Field>
        <Field label="Frequency (days)"><Input type="number" value={frequencyDays} onChange={setFreqDays} placeholder="21" /></Field>
        <Field label="Farm *"><Select value={farmId} onChange={setFarmId} options={farmOpts} /></Field>
        <Field label="Last Applied"><Input type="date" value={lastApplied} onChange={setLastApplied} /></Field>
      </FormGrid>
      <ModalFooter onCancel={onClose} onSave={save} loading={loading} />
    </Modal>
  );
}

function EditPestModal({ item, farms, onClose, onSaved, setLoading, loading }) {
  const [pestName, setPestName]       = useState(item.pest_name || '');
  const [pestType, setPestType]       = useState(item.pest_type || '');
  const [quantityL, setQuantityL]     = useState(item.quantity_l ?? '');
  const [farmId, setFarmId]           = useState(item.farm_id || farms[0]?.farm_id || '');
  const [lastApplied, setLastApplied] = useState(item.last_applied?.slice(0,10) || '');
  const [frequencyDays, setFreqDays]  = useState(item.frequency_days ?? 21);

  const farmOpts = farms.map(f => ({ value: f.farm_id, label: `${f.farm_code} — ${f.location}` }));

  const save = async () => {
    try {
      setLoading(true);
      await api.updatePesticide(item.pest_id, { pestName, pestType, quantityL: parseFloat(quantityL), farmId, lastApplied: lastApplied || null, frequencyDays: parseInt(frequencyDays) });
      onSaved({ ...item, pest_name: pestName, pest_type: pestType, quantity_l: quantityL, farm_id: farmId, last_applied: lastApplied, frequency_days: frequencyDays });
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  return (
    <Modal title={`Edit Pesticide — ${item.pest_name}`} onClose={onClose} width={520}>
      <FormGrid>
        <Field label="Name"><Input value={pestName} onChange={setPestName} /></Field>
        <Field label="Type"><Input value={pestType} onChange={setPestType} /></Field>
        <Field label="Quantity (L)"><Input type="number" value={quantityL} onChange={setQuantityL} /></Field>
        <Field label="Frequency (days)"><Input type="number" value={frequencyDays} onChange={setFreqDays} /></Field>
        <Field label="Farm"><Select value={farmId} onChange={setFarmId} options={farmOpts} /></Field>
        <Field label="Last Applied"><Input type="date" value={lastApplied} onChange={setLastApplied} /></Field>
      </FormGrid>
      <ModalFooter onCancel={onClose} onSave={save} loading={loading} />
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SENSORS  (view-only)
// ═══════════════════════════════════════════════════════════════════════════════
function SensorsSection({ sensors }) {
  const rows = sensors.map(s => [
    s.sensor_code,
    s.sensor_type,
    s.farm_code,
    s.location_desc || '—',
    s.sensor_type === 'Moisture' ? `${s.reading}%` : `${s.reading}°C`,
    new Date(s.recorded_at).toLocaleString(),
    <Badge label={s.status} />,
  ]);

  return (
    <Card>
      <CardHeader title="Sensor Data" />
      <Table headers={['Code','Type','Farm','Location','Reading','Recorded At','Status']} rows={rows} />
    </Card>
  );
}

function IrrigationSection({ irrigation }) {
  const overdue = irrigation.filter(i => i.is_overdue);

  const rows = irrigation.map(i => [
    i.farm_code,
    i.irr_type,
    i.water_source || '—',
    i.schedule || '—',
    i.frequency_days,
    i.last_irrigated ? new Date(i.last_irrigated).toLocaleDateString() : 'Never',
    i.next_due ? new Date(i.next_due).toLocaleString() : '—',
    <Badge label={i.is_overdue ? 'Overdue' : i.status} />,
  ]);

  return (
    <>
      {overdue.length > 0 && (
        <Card style={{ borderLeft: '3px solid #E24B4A', marginBottom: '1rem' }}>
          <CardHeader title={`⚠️ Irrigation Overdue (${overdue.length})`} right={<Badge label="Critical" />} />
          {overdue.map(i => (
            <AlertItem key={i.irr_id} type="red"
              title={`${i.farm_code} — ${i.irr_type}`}
              desc={`Last irrigated: ${i.last_irrigated ? new Date(i.last_irrigated).toLocaleString() : 'Never'} | Overdue by ~${Math.round(i.hours_overdue||0)}h`} />
          ))}
        </Card>
      )}
      <Card>
        <CardHeader title="Irrigation Schedule" />
        <Table headers={['Farm','Type','Source','Schedule','Every (days)','Last Done','Next Due','Status']} rows={rows} />
      </Card>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  LABOUR
// ═══════════════════════════════════════════════════════════════════════════════
function LabourSection({ labour, setLabour, farmers, farms, setLoading, loading, showToast, reload }) {
  const [showAdd, setShowAdd]       = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const activeCount    = labour.filter(l => (l.status || 'Active') === 'Active').length;
  const totalDailyWage = labour.filter(l => (l.status || 'Active') === 'Active')
                               .reduce((sum, l) => sum + (parseFloat(l.daily_wage) || 0), 0);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this labour record?')) return;
    try {
      setLoading(true);
      await api.deleteLabour(id);
      setLabour(prev => prev.filter(l => l.labour_id !== id));
      showToast('Labour record deleted');
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const rows = labour.map(l => [
    l.labour_code,
    l.full_name,
    l.role || '—',
    l.farm_code || '—',
    l.daily_wage != null ? `₹${parseFloat(l.daily_wage).toFixed(0)}` : '—',
    l.join_date?.slice(0,10) || '—',
    <Badge label={l.status || 'Active'} />,
    <div style={{ display: 'flex', gap: 6 }}>
      <Btn small onClick={() => setEditTarget(l)}>Edit</Btn>
      <Btn small variant="danger" onClick={() => handleDelete(l.labour_id)}>Delete</Btn>
    </div>,
  ]);

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <MetricCard label="Active Workers" value={activeCount} valueColor="#1D9E75" />
        <MetricCard label="Daily Wage Cost" value={`₹${totalDailyWage.toFixed(0)}`} valueColor="#185FA5" />
      </div>

      <Card>
        <CardHeader title="Labour" right={<Btn variant="primary" small onClick={() => setShowAdd(true)}>+ Add Labour</Btn>} />
        <Table
          headers={['Code', 'Name', 'Role', 'Farm', 'Daily Wage', 'Join Date', 'Status', 'Actions']}
          rows={rows}
        />
      </Card>

      {showAdd && (
        <AddLabourModal
          farmers={farmers} farms={farms}
          onClose={() => setShowAdd(false)}
          onSaved={(l) => { setLabour(prev => [...prev, l]); setShowAdd(false); showToast('Labour added'); }}
          setLoading={setLoading} loading={loading}
        />
      )}
      {editTarget && (
        <EditLabourModal
          labour={editTarget} farmers={farmers} farms={farms}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) => { setLabour(prev => prev.map(l => l.labour_id === updated.labour_id ? updated : l)); setEditTarget(null); showToast('Labour updated'); }}
          setLoading={setLoading} loading={loading}
        />
      )}
    </>
  );
}

function AddLabourModal({ farmers, farms, onClose, onSaved, setLoading, loading }) {
  const [labourCode, setLabourCode] = useState('');
  const [fullName, setFullName]     = useState('');
  const [contact, setContact]       = useState('');
  const [role, setRole]             = useState('General');
  const [dailyWage, setDailyWage]   = useState('');
  const [farmerId, setFarmerId]     = useState(farmers[0]?.farmer_id || '');
  const [farmId, setFarmId]         = useState('');
  const [joinDate, setJoinDate]     = useState('');
  const [status, setStatus]         = useState('Active');

  const farmerOpts = farmers.map(f => ({ value: f.farmer_id, label: f.full_name }));
  const farmOpts   = [{ value: '', label: '— None —' }, ...farms.map(f => ({ value: f.farm_id, label: f.farm_code + ' — ' + f.location }))];

  const save = async () => {
    if (!labourCode || !fullName || !farmerId) return alert('Fill required fields');
    try {
      setLoading(true);
      const res = await api.addLabour({ labourCode, fullName, contact, role, dailyWage: dailyWage || 0, farmerId, farmId: farmId || null, joinDate: joinDate || null, status });
      onSaved(res);
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Add Labour" onClose={onClose} width={540}>
      <FormGrid>
        <Field label="Labour Code *"><Input value={labourCode} onChange={setLabourCode} placeholder="L006" /></Field>
        <Field label="Full Name *"><Input value={fullName} onChange={setFullName} placeholder="Name" /></Field>
        <Field label="Contact"><Input value={contact} onChange={setContact} placeholder="+91 XXXXX XXXXX" /></Field>
        <Field label="Role"><Input value={role} onChange={setRole} placeholder="Harvester, Driver…" /></Field>
        <Field label="Daily Wage (₹)"><Input value={dailyWage} onChange={setDailyWage} type="number" placeholder="500" /></Field>
        <Field label="Join Date"><Input value={joinDate} onChange={setJoinDate} type="date" /></Field>
        <Field label="Farmer *">
          <Select value={farmerId} onChange={setFarmerId} options={farmerOpts} />
        </Field>
        <Field label="Farm">
          <Select value={farmId} onChange={setFarmId} options={farmOpts} />
        </Field>
      </FormGrid>
      <Field label="Status">
        <Select value={status} onChange={setStatus} options={['Active', 'Inactive']} />
      </Field>
      <ModalFooter onCancel={onClose} onSave={save} loading={loading} />
    </Modal>
  );
}

function EditLabourModal({ labour, farmers, farms, onClose, onSaved, setLoading, loading }) {
  const [fullName, setFullName]   = useState(labour.full_name  || '');
  const [contact, setContact]     = useState(labour.contact    || '');
  const [role, setRole]           = useState(labour.role       || '');
  const [dailyWage, setDailyWage] = useState(labour.daily_wage ?? '');
  const [farmerId, setFarmerId]   = useState(labour.farmer_id  || farmers[0]?.farmer_id || '');
  const [farmId, setFarmId]       = useState(labour.farm_id    || '');
  const [status, setStatus]       = useState(labour.status     || 'Active');

  const farmerOpts = farmers.map(f => ({ value: f.farmer_id, label: f.full_name }));
  const farmOpts   = [{ value: '', label: '— None —' }, ...farms.map(f => ({ value: f.farm_id, label: f.farm_code + ' — ' + f.location }))];

  const save = async () => {
    try {
      setLoading(true);
      await api.updateLabour(labour.labour_id, { fullName, contact, role, dailyWage: dailyWage || 0, farmId: farmId || null, status });
      onSaved({ ...labour, full_name: fullName, contact, role, daily_wage: dailyWage, farm_id: farmId, status });
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Edit Labour" onClose={onClose} width={540}>
      <FormGrid>
        <Field label="Full Name"><Input value={fullName} onChange={setFullName} /></Field>
        <Field label="Contact"><Input value={contact} onChange={setContact} /></Field>
        <Field label="Role"><Input value={role} onChange={setRole} /></Field>
        <Field label="Daily Wage (₹)"><Input value={dailyWage} onChange={setDailyWage} type="number" /></Field>
        <Field label="Farmer">
          <Select value={farmerId} onChange={setFarmerId} options={farmerOpts} />
        </Field>
        <Field label="Farm">
          <Select value={farmId} onChange={setFarmId} options={farmOpts} />
        </Field>
      </FormGrid>
      <Field label="Status">
        <Select value={status} onChange={setStatus} options={['Active', 'Inactive']} />
      </Field>
      <ModalFooter onCancel={onClose} onSave={save} loading={loading} />
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  FINANCE
// ═══════════════════════════════════════════════════════════════════════════════
function FinanceSection({ finance, setFinance, farmers, farms, setLoading, loading, showToast, reload }) {
  const [showAdd, setShowAdd]       = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const totalIncome  = finance.filter(f => f.type === 'Income') .reduce((s, f) => s + (parseFloat(f.amount) || 0), 0);
  const totalExpense = finance.filter(f => f.type === 'Expense').reduce((s, f) => s + (parseFloat(f.amount) || 0), 0);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this finance record?')) return;
    try {
      setLoading(true);
      await api.deleteFinance(id);
      setFinance(prev => prev.filter(f => f.finance_id !== id));
      showToast('Record deleted');
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const rows = finance.map(f => [
    f.farmer_name || '—',
    f.farm_code   || '—',
    <Badge label={f.type} />,
    f.category || '—',
    <span style={{ color: f.type === 'Income' ? '#1D9E75' : '#A32D2D', fontWeight: 600 }}>
      ₹{parseFloat(f.amount || 0).toLocaleString('en-IN')}
    </span>,
    f.record_date?.slice(0,10) || '—',
    <div style={{ display: 'flex', gap: 6 }}>
      <Btn small onClick={() => setEditTarget(f)}>Edit</Btn>
      <Btn small variant="danger" onClick={() => handleDelete(f.finance_id)}>Delete</Btn>
    </div>,
  ]);

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <MetricCard label="Total Income"  value={`₹${totalIncome.toLocaleString('en-IN')}`}  valueColor="#1D9E75" />
        <MetricCard label="Total Expense" value={`₹${totalExpense.toLocaleString('en-IN')}`} valueColor="#A32D2D" />
      </div>

      <Card>
        <CardHeader title="Finance Records" right={<Btn variant="primary" small onClick={() => setShowAdd(true)}>+ Add Record</Btn>} />
        <Table
          headers={['Farmer', 'Farm', 'Type', 'Category', 'Amount', 'Date', 'Actions']}
          rows={rows}
        />
      </Card>

      {showAdd && (
        <AddFinanceModal
          farmers={farmers} farms={farms}
          onClose={() => setShowAdd(false)}
          onSaved={(r) => { setFinance(prev => [...prev, r]); setShowAdd(false); showToast('Record added'); }}
          setLoading={setLoading} loading={loading}
        />
      )}
      {editTarget && (
        <EditFinanceModal
          record={editTarget} farmers={farmers} farms={farms}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) => { setFinance(prev => prev.map(f => f.finance_id === updated.finance_id ? updated : f)); setEditTarget(null); showToast('Record updated'); }}
          setLoading={setLoading} loading={loading}
        />
      )}
    </>
  );
}

const INCOME_CATS  = ['Crop Sale', 'Livestock Sale', 'Subsidy', 'Grant', 'Other Income'];
const EXPENSE_CATS = ['Seeds', 'Fertilizer', 'Pesticide', 'Labour', 'Equipment', 'Fuel', 'Irrigation', 'Other Expense'];

function AddFinanceModal({ farmers, farms, onClose, onSaved, setLoading, loading }) {
  const [farmerId, setFarmerId]     = useState(farmers[0]?.farmer_id || '');
  const [farmId, setFarmId]         = useState('');
  const [type, setType]             = useState('Income');
  const [category, setCategory]     = useState('');
  const [amount, setAmount]         = useState('');
  const [description, setDesc]      = useState('');
  const [recordDate, setRecordDate] = useState('');

  const farmerOpts = farmers.map(f => ({ value: f.farmer_id, label: f.full_name }));
  const farmOpts   = [{ value: '', label: '— None —' }, ...farms.map(f => ({ value: f.farm_id, label: f.farm_code + ' — ' + f.location }))];
  const catOpts    = type === 'Income' ? INCOME_CATS : EXPENSE_CATS;

  const save = async () => {
    if (!amount || !farmerId) return alert('Fill required fields');
    try {
      setLoading(true);
      const res = await api.addFinance({ farmerId, farmId: farmId || null, type, category, amount: parseFloat(amount), description, recordDate: recordDate || null });
      onSaved(res);
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Add Finance Record" onClose={onClose} width={540}>
      <FormGrid>
        <Field label="Farmer *">
          <Select value={farmerId} onChange={setFarmerId} options={farmerOpts} />
        </Field>
        <Field label="Farm">
          <Select value={farmId} onChange={setFarmId} options={farmOpts} />
        </Field>
        <Field label="Type">
          <Select value={type} onChange={v => { setType(v); setCategory(''); }} options={['Income', 'Expense']} />
        </Field>
        <Field label="Category">
          <Select value={category} onChange={setCategory} options={[{ value: '', label: '— Select —' }, ...catOpts.map(c => ({ value: c, label: c }))]} />
        </Field>
        <Field label="Amount (₹) *"><Input value={amount} onChange={setAmount} type="number" placeholder="0" /></Field>
        <Field label="Record Date"><Input value={recordDate} onChange={setRecordDate} type="date" /></Field>
      </FormGrid>
      <Field label="Description"><Input value={description} onChange={setDesc} placeholder="Optional notes" /></Field>
      <ModalFooter onCancel={onClose} onSave={save} loading={loading} />
    </Modal>
  );
}

function EditFinanceModal({ record, farmers, farms, onClose, onSaved, setLoading, loading }) {
  const [farmerId, setFarmerId]     = useState(record.farmer_id   || farmers[0]?.farmer_id || '');
  const [farmId, setFarmId]         = useState(record.farm_id     || '');
  const [type, setType]             = useState(record.type        || 'Income');
  const [category, setCategory]     = useState(record.category    || '');
  const [amount, setAmount]         = useState(record.amount      ?? '');
  const [description, setDesc]      = useState(record.description || '');
  const [recordDate, setRecordDate] = useState(record.record_date ? record.record_date.slice(0, 10) : '');

  const farmerOpts = farmers.map(f => ({ value: f.farmer_id, label: f.full_name }));
  const farmOpts   = [{ value: '', label: '— None —' }, ...farms.map(f => ({ value: f.farm_id, label: f.farm_code + ' — ' + f.location }))];
  const catOpts    = type === 'Income' ? INCOME_CATS : EXPENSE_CATS;

  const save = async () => {
    try {
      setLoading(true);
      await api.updateFinance(record.finance_id, { farmerId, farmId: farmId || null, type, category, amount: parseFloat(amount), description, recordDate: recordDate || null });
      onSaved({ ...record, farmer_id: farmerId, farm_id: farmId, type, category, amount, description, record_date: recordDate });
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Edit Finance Record" onClose={onClose} width={540}>
      <FormGrid>
        <Field label="Farmer">
          <Select value={farmerId} onChange={setFarmerId} options={farmerOpts} />
        </Field>
        <Field label="Farm">
          <Select value={farmId} onChange={setFarmId} options={farmOpts} />
        </Field>
        <Field label="Type">
          <Select value={type} onChange={v => { setType(v); setCategory(''); }} options={['Income', 'Expense']} />
        </Field>
        <Field label="Category">
          <Select value={category} onChange={setCategory} options={[{ value: '', label: '— Select —' }, ...catOpts.map(c => ({ value: c, label: c }))]} />
        </Field>
        <Field label="Amount (₹)"><Input value={amount} onChange={setAmount} type="number" /></Field>
        <Field label="Record Date"><Input value={recordDate} onChange={setRecordDate} type="date" /></Field>
      </FormGrid>
      <Field label="Description"><Input value={description} onChange={setDesc} /></Field>
      <ModalFooter onCancel={onClose} onSave={save} loading={loading} />
    </Modal>
  );
}
