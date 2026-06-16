// ============================================================
//  Agrovision v2 — Farmer Portal
//  Farmers manage: Farm, Equipment, Fertilizers, Pesticides, Irrigation
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import {
  Card, CardHeader, Table, Badge, MetricCard, AlertItem,
  Modal, ModalFooter, Field, Input, Select, FormGrid,
  Sidebar, Topbar, Btn, Toast, useToast
} from './Shared';

export default function FarmerPortal({ user, onLogout }) {
  const fid = user.farmer_id;
  const [nav,         setNav]         = useState('dashboard');
  const [farms,       setFarms]       = useState([]);
  const [crops,       setCrops]       = useState([]);
  const [equipment,   setEquipment]   = useState([]);
  const [fertilizers, setFertilizers] = useState([]);
  const [pesticides,  setPesticides]  = useState([]);
  const [irrigation,  setIrrigation]  = useState([]);
  const [alerts,      setAlerts]      = useState([]);
  const [reminders,   setReminders]   = useState([]);
  const [sensors,     setSensors]     = useState([]);
  const [modal,       setModal]       = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [toast, showToast]            = useToast();

  const load = useCallback(async () => {
    try {
      const [fm,c,e,fe,p,i,a,r,s] = await Promise.all([
        api.getFarms({ farmer_id: fid }),
        api.getCrops({ farmer_id: fid }),
        api.getEquipment({ farmer_id: fid }),
        api.getFertilizers({ farmer_id: fid }),
        api.getPesticides({ farmer_id: fid }),
        api.getIrrigation({ farmer_id: fid }),
        api.getAlerts({ farmer_id: fid }),
        api.getReminders(fid),
        api.getSensors(),
      ]);
      setFarms(fm); setCrops(c); setEquipment(e); setFertilizers(fe);
      setPesticides(p); setIrrigation(i); setAlerts(a); setReminders(r);
      setSensors(s.filter(s => fm.some(f => f.farm_id === s.farm_id)));
    } catch(err) { showToast(err.message,'error'); }
  }, [fid]);

  useEffect(() => { load(); }, [load]);

  const overdueIrr  = irrigation.filter(i=>i.is_overdue).length;
  const overdueFert = fertilizers.filter(f=>f.is_overdue).length;
  const overduePest = pesticides.filter(p=>p.is_overdue).length;
  const totalBadge  = alerts.length + overdueIrr + overdueFert + overduePest;

  const navItems = [
    { id:'dashboard',  icon:'📊', label:'Dashboard',    badge: totalBadge },
    { id:'my-farms',   icon:'🏡', label:'My Farms' },
    { id:'my-crops',   icon:'🌱', label:'My Crops' },
    { id:'equipment',  icon:'⚙️', label:'Equipment' },
    { id:'fertilizers',icon:'🌿', label:'Fertilizers',  badge: overdueFert },
    { id:'pesticides', icon:'🛡️', label:'Pesticides',   badge: overduePest },
    { id:'irrigation', icon:'💧', label:'Irrigation',   badge: overdueIrr },
    { id:'alerts',     icon:'🔔', label:'Alerts',       badge: alerts.length },
  ];

  const initials = (user.full_name||'F').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();

  // ─── Shared "Apply" modal for fertilizer/pesticide ───────────────────────
  const ApplyModal = ({ item, type }) => {
    const [qty,  setQty]  = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0,10));
    async function save() {
      if (!qty) return showToast('Enter quantity','error');
      setLoading(true);
      try {
        if (type==='fertilizer') await api.applyFertilizer(item.fert_id, { quantityUsed: qty, appliedDate: date });
        else                     await api.applyPesticide(item.pest_id,  { quantityUsed: qty, appliedDate: date });
        showToast(`${item.fert_name||item.pest_name} application recorded!`);
        setModal(null); load();
      } catch(e){ showToast(e.message,'error'); } finally { setLoading(false); }
    }
    return (
      <Modal title={`Record Application — ${item.fert_name||item.pest_name}`} onClose={()=>setModal(null)}>
        <Field label={`Quantity Used (${type==='fertilizer'?'kg':'L'})`}>
          <Input type="number" value={qty} onChange={setQty} placeholder="e.g. 25" min="0" />
        </Field>
        <Field label="Date Applied">
          <Input type="date" value={date} onChange={setDate} />
        </Field>
        <div style={{ background:'#f5f5f3', borderRadius:8, padding:'10px 12px', fontSize:12, color:'#6b6b67', marginBottom:'0.5rem' }}>
          Available stock: <strong>{type==='fertilizer' ? `${item.quantity_kg - item.used_kg} kg` : `${item.quantity_l - (item.used_l||0)} L`}</strong>
          &nbsp;|&nbsp; Last applied: <strong>{item.last_applied?.slice(0,10)||'Never'}</strong>
          &nbsp;|&nbsp; Next due every <strong>{item.frequency_days} days</strong>
        </div>
        <ModalFooter onCancel={()=>setModal(null)} onSave={save} saveLabel="Record Application" loading={loading} />
      </Modal>
    );
  };

  // ─── Irrigate modal ───────────────────────────────────────────────────────
  const IrrigateModal = ({ item }) => {
    const [dt, setDt] = useState(new Date().toISOString().slice(0,16));
    async function save() {
      setLoading(true);
      try {
        await api.irrigate(item.irr_id, { irrigatedAt: dt });
        showToast('Irrigation recorded!'); setModal(null); load();
      } catch(e){ showToast(e.message,'error'); } finally { setLoading(false); }
    }
    return (
      <Modal title={`Record Irrigation — ${item.farm_code}`} onClose={()=>setModal(null)}>
        <Field label="Irrigation Date & Time">
          <Input type="datetime-local" value={dt} onChange={setDt} />
        </Field>
        <div style={{ background:'#f5f5f3', borderRadius:8, padding:'10px 12px', fontSize:12, color:'#6b6b67', marginBottom:'0.5rem' }}>
          Type: <strong>{item.irr_type}</strong> &nbsp;|&nbsp; Source: <strong>{item.water_source}</strong>
          &nbsp;|&nbsp; Every <strong>{item.frequency_days} day(s)</strong>
          &nbsp;|&nbsp; Last done: <strong>{item.last_irrigated ? new Date(item.last_irrigated).toLocaleString() : 'Never'}</strong>
        </div>
        <ModalFooter onCancel={()=>setModal(null)} onSave={save} saveLabel="Mark as Done" loading={loading} />
      </Modal>
    );
  };

  // ─── Add Farm modal ───────────────────────────────────────────────────────
  const AddFarmModal = () => {
    const [f, setF] = useState({ farmCode:'', location:'', areaHa:'' });
    async function save() {
      if (!f.farmCode||!f.location) return showToast('Fill required fields','error');
      setLoading(true);
      try {
        await api.addFarm({ ...f, farmerId: fid });
        showToast('Farm added!'); setModal(null); load();
      } catch(e){ showToast(e.message,'error'); } finally { setLoading(false); }
    }
    return (
      <Modal title="Add New Farm" onClose={()=>setModal(null)}>
        <FormGrid>
          <Field label="Farm Code *"><Input value={f.farmCode} onChange={v=>setF(p=>({...p,farmCode:v}))} placeholder="FM106" /></Field>
          <Field label="Area (ha)"><Input type="number" value={f.areaHa} onChange={v=>setF(p=>({...p,areaHa:v}))} placeholder="5.0" /></Field>
        </FormGrid>
        <Field label="Location *"><Input value={f.location} onChange={v=>setF(p=>({...p,location:v}))} placeholder="City, State" /></Field>
        <ModalFooter onCancel={()=>setModal(null)} onSave={save} loading={loading} />
      </Modal>
    );
  };

  // ─── Add Equipment modal ──────────────────────────────────────────────────
  const AddEquipmentModal = () => {
    const [f, setF] = useState({ equipCode:'', equipName:'', model:'', condition:'Good' });
    async function save() {
      if (!f.equipCode||!f.equipName) return showToast('Fill required fields','error');
      setLoading(true);
      try {
        await api.addEquipment({ ...f, farmerId: fid });
        showToast('Equipment added!'); setModal(null); load();
      } catch(e){ showToast(e.message,'error'); } finally { setLoading(false); }
    }
    return (
      <Modal title="Add Equipment" onClose={()=>setModal(null)}>
        <FormGrid>
          <Field label="Equipment Code *"><Input value={f.equipCode} onChange={v=>setF(p=>({...p,equipCode:v}))} placeholder="EQ006" /></Field>
          <Field label="Name *"><Input value={f.equipName} onChange={v=>setF(p=>({...p,equipName:v}))} placeholder="e.g. Tractor" /></Field>
          <Field label="Model"><Input value={f.model} onChange={v=>setF(p=>({...p,model:v}))} placeholder="e.g. Mahindra 575" /></Field>
          <Field label="Condition">
            <Select value={f.condition} onChange={v=>setF(p=>({...p,condition:v}))} options={['Good','Service Due','Repair Needed']} />
          </Field>
        </FormGrid>
        <ModalFooter onCancel={()=>setModal(null)} onSave={save} loading={loading} />
      </Modal>
    );
  };

  // ─── Add Fertilizer modal ─────────────────────────────────────────────────
  const AddFertilizerModal = () => {
    const [f, setF] = useState({ fertName:'', fertType:'', quantityKg:'', lastApplied:'', frequencyDays:'30', farmId:'' });
    async function save() {
      if (!f.fertName||!f.farmId||!f.quantityKg) return showToast('Fill required fields','error');
      setLoading(true);
      try {
        await api.addFertilizer(f);
        showToast('Fertilizer added!'); setModal(null); load();
      } catch(e){ showToast(e.message,'error'); } finally { setLoading(false); }
    }
    return (
      <Modal title="Add Fertilizer" onClose={()=>setModal(null)}>
        <FormGrid>
          <Field label="Name *"><Input value={f.fertName} onChange={v=>setF(p=>({...p,fertName:v}))} placeholder="e.g. Urea" /></Field>
          <Field label="Type"><Input value={f.fertType} onChange={v=>setF(p=>({...p,fertType:v}))} placeholder="e.g. Nitrogen" /></Field>
          <Field label="Quantity (kg) *"><Input type="number" value={f.quantityKg} onChange={v=>setF(p=>({...p,quantityKg:v}))} placeholder="500" /></Field>
          <Field label="Frequency (days) *"><Input type="number" value={f.frequencyDays} onChange={v=>setF(p=>({...p,frequencyDays:v}))} placeholder="30" /></Field>
        </FormGrid>
        <FormGrid>
          <Field label="Farm *">
            <Select value={f.farmId} onChange={v=>setF(p=>({...p,farmId:v}))}
              options={[{value:'',label:'Select farm…'},...farms.map(fm=>({value:fm.farm_id,label:fm.farm_code+' — '+fm.location}))]} />
          </Field>
          <Field label="Last Applied Date">
            <Input type="date" value={f.lastApplied} onChange={v=>setF(p=>({...p,lastApplied:v}))} />
          </Field>
        </FormGrid>
        <ModalFooter onCancel={()=>setModal(null)} onSave={save} loading={loading} />
      </Modal>
    );
  };

  // ─── Add Pesticide modal ──────────────────────────────────────────────────
  const AddPesticideModal = () => {
    const [f, setF] = useState({ pestName:'', pestType:'', quantityL:'', lastApplied:'', frequencyDays:'21', farmId:'' });
    async function save() {
      if (!f.pestName||!f.farmId||!f.quantityL) return showToast('Fill required fields','error');
      setLoading(true);
      try {
        await api.addPesticide(f);
        showToast('Pesticide added!'); setModal(null); load();
      } catch(e){ showToast(e.message,'error'); } finally { setLoading(false); }
    }
    return (
      <Modal title="Add Pesticide" onClose={()=>setModal(null)}>
        <FormGrid>
          <Field label="Name *"><Input value={f.pestName} onChange={v=>setF(p=>({...p,pestName:v}))} placeholder="e.g. Chlorpyrifos" /></Field>
          <Field label="Type"><Input value={f.pestType} onChange={v=>setF(p=>({...p,pestType:v}))} placeholder="Insecticide" /></Field>
          <Field label="Quantity (L) *"><Input type="number" value={f.quantityL} onChange={v=>setF(p=>({...p,quantityL:v}))} placeholder="20" /></Field>
          <Field label="Frequency (days)"><Input type="number" value={f.frequencyDays} onChange={v=>setF(p=>({...p,frequencyDays:v}))} placeholder="21" /></Field>
        </FormGrid>
        <FormGrid>
          <Field label="Farm *">
            <Select value={f.farmId} onChange={v=>setF(p=>({...p,farmId:v}))}
              options={[{value:'',label:'Select farm…'},...farms.map(fm=>({value:fm.farm_id,label:fm.farm_code+' — '+fm.location}))]} />
          </Field>
          <Field label="Last Applied Date">
            <Input type="date" value={f.lastApplied} onChange={v=>setF(p=>({...p,lastApplied:v}))} />
          </Field>
        </FormGrid>
        <ModalFooter onCancel={()=>setModal(null)} onSave={save} loading={loading} />
      </Modal>
    );
  };

  // ─── Add Irrigation modal ─────────────────────────────────────────────────
  const AddIrrigationModal = () => {
    const [f, setF] = useState({ farmId:'', irrType:'Drip Irrigation', waterSource:'Borewell', schedule:'', frequencyDays:'1', lastIrrigated:'' });
    async function save() {
      if (!f.farmId||!f.irrType) return showToast('Fill required fields','error');
      setLoading(true);
      try {
        await api.addIrrigation(f);
        showToast('Irrigation added!'); setModal(null); load();
      } catch(e){ showToast(e.message,'error'); } finally { setLoading(false); }
    }
    return (
      <Modal title="Add Irrigation System" onClose={()=>setModal(null)}>
        <FormGrid>
          <Field label="Farm *">
            <Select value={f.farmId} onChange={v=>setF(p=>({...p,farmId:v}))}
              options={[{value:'',label:'Select farm…'},...farms.map(fm=>({value:fm.farm_id,label:fm.farm_code+' — '+fm.location}))]} />
          </Field>
          <Field label="Irrigation Type">
            <Select value={f.irrType} onChange={v=>setF(p=>({...p,irrType:v}))} options={['Drip Irrigation','Sprinkler','Flood','Micro-sprinkler','Furrow']} />
          </Field>
          <Field label="Water Source">
            <Select value={f.waterSource} onChange={v=>setF(p=>({...p,waterSource:v}))} options={['Borewell','Canal','River','Reservoir','Rainwater']} />
          </Field>
          <Field label="Frequency (days)">
            <Input type="number" value={f.frequencyDays} onChange={v=>setF(p=>({...p,frequencyDays:v}))} placeholder="1" />
          </Field>
        </FormGrid>
        <Field label="Schedule (description)">
          <Input value={f.schedule} onChange={v=>setF(p=>({...p,schedule:v}))} placeholder="e.g. Daily 6:00 AM" />
        </Field>
        <Field label="Last Irrigated (optional)">
          <Input type="datetime-local" value={f.lastIrrigated} onChange={v=>setF(p=>({...p,lastIrrigated:v}))} />
        </Field>
        <ModalFooter onCancel={()=>setModal(null)} onSave={save} loading={loading} />
      </Modal>
    );
  };

  const addBtn = (label, m) => <Btn variant="primary" onClick={() => setModal(m)}>+ {label}</Btn>;

  return (
    <div style={{ display:'flex', height:'100vh', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <Sidebar navItems={navItems} activeNav={nav} onNav={setNav} onLogout={onLogout} subtitle={user.full_name} />

      <div style={{ flex:1, overflowY:'auto', background:'#eeede9' }}>
        <Topbar title={navItems.find(n=>n.id===nav)?.label||''} userName={user.full_name} initials={initials} isAdmin={false}
          right={
            nav==='my-farms'    ? addBtn('Add Farm','add-farm') :
            nav==='equipment'   ? addBtn('Add Equipment','add-equipment') :
            nav==='fertilizers' ? addBtn('Add Fertilizer','add-fertilizer') :
            nav==='pesticides'  ? addBtn('Add Pesticide','add-pesticide') :
            nav==='irrigation'  ? addBtn('Add Irrigation','add-irrigation') : null
          } />

        <div style={{ padding:'1.5rem' }}>

          {/* ── DASHBOARD ── */}
          {nav==='dashboard' && <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:'1.5rem' }}>
              <MetricCard label="My Farms"   value={farms.length} />
              <MetricCard label="My Crops"   value={crops.length} />
              <MetricCard label="Sensors"    value={sensors.length} />
              <MetricCard label="Alerts"     value={alerts.length} valueColor={alerts.length>0?'#A32D2D':undefined} />
            </div>

            {/* Reminders */}
            {reminders.length > 0 && (
              <Card style={{ borderLeft:'3px solid #BA7517', marginBottom:'1rem' }}>
                <CardHeader title="⏰ Action Required" right={<span style={{ fontSize:12, color:'#854F0B', fontWeight:600 }}>{reminders.length} reminder{reminders.length>1?'s':''}</span>} />
                {reminders.map((r,i) => (
                  <AlertItem key={i} type="amber"
                    icon={r.category==='Irrigation'?'💧':r.category==='Fertilizer'?'🌿':'🛡️'}
                    title={`${r.category} — ${r.message}`}
                    desc={r.days_overdue > 0 ? `${r.days_overdue} day(s) overdue` : 'Due today'} />
                ))}
              </Card>
            )}

            {/* Sensor snapshot */}
            {sensors.length > 0 && (
              <Card style={{ marginBottom:'1rem' }}>
                <CardHeader title="📡 Live Sensor Readings" right={<Badge label="Live" />} />
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:10 }}>
                  {sensors.map(s => {
                    const val = parseFloat(s.reading);
                    const isM = s.sensor_type==='Moisture';
                    const pct = isM ? val : Math.min(100, Math.round(val/45*100));
                    const col = isM ? (val<25?'#E24B4A':val<50?'#EF9F27':'#1D9E75') : (val>32?'#E24B4A':val>28?'#EF9F27':'#1D9E75');
                    return (
                      <div key={s.sensor_id} style={{ background:'#f5f5f3', borderRadius:8, padding:'10px 12px' }}>
                        <div style={{ fontSize:11, color:'#6b6b67', marginBottom:4 }}>{isM?'💧':'🌡️'} {s.farm_code} · {s.location_desc}</div>
                        <div style={{ height:5, background:'rgba(0,0,0,0.08)', borderRadius:3, overflow:'hidden', marginBottom:4 }}>
                          <div style={{ width:`${pct}%`, height:'100%', background:col, borderRadius:3 }} />
                        </div>
                        <div style={{ fontSize:16, fontWeight:700, color:col }}>{isM?`${val}%`:`${val}°C`}</div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Recent crops */}
            <Card>
              <CardHeader title="My Crops" right={<Btn small onClick={()=>setNav('my-crops')}>View all →</Btn>} />
              <Table headers={['Crop','Farm','Season','Progress','Status']}
                rows={crops.slice(0,5).map(c=>[c.crop_name,c.farm_code,c.season,
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ flex:1, height:5, background:'rgba(0,0,0,0.08)', borderRadius:3, overflow:'hidden', minWidth:60 }}>
                      <div style={{ width:`${c.progress_pct}%`, height:'100%', background:c.progress_pct>70?'#1D9E75':c.progress_pct>40?'#EF9F27':'#E24B4A', borderRadius:3 }} />
                    </div>
                    <span style={{ fontSize:11, color:'#6b6b67' }}>{c.progress_pct}%</span>
                  </div>,
                  <Badge label={c.status} />
                ])} />
            </Card>
          </>}

          {/* ── MY FARMS ── */}
          {nav==='my-farms' && <Card>
            <Table headers={['Code','Location','Area (ha)','Crops','Status']}
              rows={farms.map(f=>[f.farm_code,f.location,f.area_ha,f.crop_count,<Badge label={f.status}/>])} />
          </Card>}

          {/* ── MY CROPS ── */}
          {nav==='my-crops' && <Card>
            <Table headers={['Crop','Farm','Season','Planted','Harvest','Progress','Status']}
              rows={crops.map(c=>[c.crop_name,c.farm_code,c.season,c.planted_date?.slice(0,10)||'—',c.harvest_date?.slice(0,10)||'—',`${c.progress_pct}%`,<Badge label={c.status}/>])} />
          </Card>}

          {/* ── EQUIPMENT ── */}
          {nav==='equipment' && <Card>
            <Table headers={['Code','Name','Model','Condition']}
              rows={equipment.map(e=>[e.equip_code,e.equip_name,e.model||'—',<Badge label={e.condition}/>])} />
          </Card>}

          {/* ── FERTILIZERS ── */}
          {nav==='fertilizers' && <>
            {fertilizers.filter(f=>f.is_overdue).length > 0 && (
              <Card style={{ borderLeft:'3px solid #BA7517', marginBottom:'1rem' }}>
                <CardHeader title="🌿 Fertilizer Applications Overdue" right={<Badge label="Warning" />} />
                {fertilizers.filter(f=>f.is_overdue).map(f=>(
                  <AlertItem key={f.fert_id} type="amber"
                    title={`${f.fert_name} — ${f.farm_code}`}
                    desc={`Last applied: ${f.last_applied?.slice(0,10)||'Never'} | Next due: ${f.next_due?.slice(0,10)||'—'} | ${f.days_overdue||0} day(s) overdue`}
                    onResolve={() => setModal({ type:'apply-fert', item:f })} />
                ))}
              </Card>
            )}
            <Card>
              <Table headers={['Name','Type','Farm','Stock (kg)','Used (kg)','Last Applied','Next Due','Status','Action']}
                rows={fertilizers.map(f=>[
                  f.fert_name, f.fert_type||'—', f.farm_code, f.quantity_kg, f.used_kg,
                  f.last_applied?.slice(0,10)||'Never', f.next_due?.slice(0,10)||'—',
                  <Badge label={f.is_overdue?'Overdue':'OK'}/>,
                  <Btn small variant={f.is_overdue?'danger':'default'} onClick={()=>setModal({type:'apply-fert',item:f})}>Record</Btn>
                ])} />
            </Card>
          </>}

          {/* ── PESTICIDES ── */}
          {nav==='pesticides' && <>
            {pesticides.filter(p=>p.is_overdue).length > 0 && (
              <Card style={{ borderLeft:'3px solid #BA7517', marginBottom:'1rem' }}>
                <CardHeader title="🛡️ Pesticide Applications Overdue" right={<Badge label="Warning" />} />
                {pesticides.filter(p=>p.is_overdue).map(p=>(
                  <AlertItem key={p.pest_id} type="amber"
                    title={`${p.pest_name} — ${p.farm_code}`}
                    desc={`Last applied: ${p.last_applied?.slice(0,10)||'Never'} | Next due: ${p.next_due?.slice(0,10)||'—'} | ${p.days_overdue||0} day(s) overdue`}
                    onResolve={() => setModal({ type:'apply-pest', item:p })} />
                ))}
              </Card>
            )}
            <Card>
              <Table headers={['Name','Type','Farm','Stock (L)','Used (L)','Last Applied','Next Due','Status','Action']}
                rows={pesticides.map(p=>[
                  p.pest_name, p.pest_type||'—', p.farm_code, p.quantity_l, p.used_l||0,
                  p.last_applied?.slice(0,10)||'Never', p.next_due?.slice(0,10)||'—',
                  <Badge label={p.is_overdue?'Overdue':'OK'}/>,
                  <Btn small variant={p.is_overdue?'danger':'default'} onClick={()=>setModal({type:'apply-pest',item:p})}>Record</Btn>
                ])} />
            </Card>
          </>}

          {/* ── IRRIGATION ── */}
          {nav==='irrigation' && <>
            {irrigation.filter(i=>i.is_overdue).length > 0 && (
              <Card style={{ borderLeft:'3px solid #E24B4A', marginBottom:'1rem' }}>
                <CardHeader title="💧 Irrigation Required" right={<Badge label="Critical" />} />
                {irrigation.filter(i=>i.is_overdue).map(i=>(
                  <AlertItem key={i.irr_id} type="red"
                    title={`${i.farm_code} — ${i.irr_type} overdue`}
                    desc={`Last irrigated: ${i.last_irrigated ? new Date(i.last_irrigated).toLocaleDateString() : 'Never'} | Overdue by ~${Math.round(i.hours_overdue||0)}h`}
                    onResolve={() => setModal({ type:'irrigate', item:i })} />
                ))}
              </Card>
            )}
            <Card>
              <Table headers={['Farm','Type','Source','Schedule','Every (days)','Last Done','Next Due','Status','Action']}
                rows={irrigation.map(i=>[
                  i.farm_code, i.irr_type, i.water_source||'—', i.schedule||'—', i.frequency_days,
                  i.last_irrigated ? new Date(i.last_irrigated).toLocaleDateString() : 'Never',
                  i.next_due ? new Date(i.next_due).toLocaleString() : '—',
                  <Badge label={i.is_overdue?'Overdue':i.status}/>,
                  <Btn small variant={i.is_overdue?'danger':'default'} onClick={()=>setModal({type:'irrigate',item:i})}>Done ✓</Btn>
                ])} />
            </Card>
          </>}

          {/* ── ALERTS ── */}
          {nav==='alerts' && <>
            {alerts.length===0
              ? <AlertItem type="green" title="No active alerts" desc="All systems are running normally." />
              : alerts.map(a=>(
                <AlertItem key={a.alert_id} type={a.alert_type}
                  title={a.message} desc={`Farm: ${a.farm_code} | Category: ${a.category}`}
                  time={new Date(a.created_at).toLocaleString()}
                  onResolve={async ()=>{ await api.resolveAlert(a.alert_id); load(); showToast('Alert resolved'); }} />
              ))}
          </>}

        </div>
      </div>

      {/* ── Modals ── */}
      {modal==='add-farm'       && <AddFarmModal />}
      {modal==='add-equipment'  && <AddEquipmentModal />}
      {modal==='add-fertilizer' && <AddFertilizerModal />}
      {modal==='add-pesticide'  && <AddPesticideModal />}
      {modal==='add-irrigation' && <AddIrrigationModal />}
      {modal?.type==='apply-fert' && <ApplyModal item={modal.item} type="fertilizer" />}
      {modal?.type==='apply-pest' && <ApplyModal item={modal.item} type="pesticide" />}
      {modal?.type==='irrigate'   && <IrrigateModal item={modal.item} />}

      <Toast message={toast?.msg} type={toast?.type} />
    </div>
  );
}
