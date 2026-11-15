import { useEffect, useMemo, useState } from 'react';
import {
  Activity, Sprout, Droplets, Gauge, LayoutDashboard, Tractor, Leaf,
  ClipboardList, Settings, Bell, Search, Plus, ChevronDown, ArrowUpRight,
  ArrowDownRight, CloudSun, CloudRain, Sun, Clock3, CheckCircle2,
  AlertTriangle, Play, Pause, MoreHorizontal, Menu, X, Waves, CalendarDays,
  TrendingUp, MapPin, ThermometerSun, CircleHelp
} from 'lucide-react';
import { initialFields, initialLogs, crops } from './data/demoData.js';
import { getIrrigationRecommendation } from './irrigation.js';
import { apiRequest } from './services.js';

const money = (value) => new Intl.NumberFormat('en-IN').format(value);

function mapApiField(field) {
  return {
    id: field.id,
    name: field.name,
    crop: field.crop,
    area: field.area,
    soil: field.soil,
    moisture: field.moisture,
    threshold: field.threshold,
    status: field.status,
    updated: field.updated ? new Date(field.updated).toLocaleString() : 'Just now'
  };
}

function mapApiLog(log) {
  return {
    id: log.id,
    field: log.field?.name || 'Field',
    date: log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Recently',
    duration: log.durationMinutes,
    water: log.waterUsedLitres,
    method: log.method
  };
}
const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'fields', label: 'My fields', icon: Tractor },
  { id: 'monitoring', label: 'Soil monitoring', icon: Gauge },
  { id: 'irrigation', label: 'Irrigation', icon: Droplets },
  { id: 'analytics', label: 'Analytics', icon: ClipboardList }
];

function App() {
  const [active, setActive] = useState('overview');
  const [fields, setFields] = useState(initialFields);
  const [logs, setLogs] = useState(initialLogs);
  const [selectedField, setSelectedField] = useState(1);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const [storageMode, setStorageMode] = useState('checking');
  const [form, setForm] = useState({ name: '', crop: 'Tomato', area: '', soil: 'Loamy' });

  useEffect(() => {
    let active = true;
    async function loadDatabaseData() {
      try {
        const [remoteFields, remoteLogs] = await Promise.all([
          apiRequest('/fields'),
          apiRequest('/irrigation/history')
        ]);
        if (!active) return;
        if (Array.isArray(remoteFields) && remoteFields.length) {
          const mapped = remoteFields.map(mapApiField);
          setFields(mapped);
          setSelectedField(mapped[0].id);
        }
        if (Array.isArray(remoteLogs)) setLogs(remoteLogs.map(mapApiLog));
        setStorageMode('database');
      } catch {
        if (active) setStorageMode('demo');
      }
    }
    loadDatabaseData();
    return () => { active = false; };
  }, []);

  const selected = fields.find((field) => field.id === selectedField) || fields[0];
  const totalArea = fields.reduce((sum, field) => sum + Number(field.area), 0);
  const waterUsed = logs.reduce((sum, log) => sum + log.water, 0);
  const needsWater = fields.filter((field) => getIrrigationRecommendation(field.moisture, field.threshold).level === 'warning').length;

  function notify(message) {
    setToast(message);
    window.clearTimeout(window.__agroToast);
    window.__agroToast = window.setTimeout(() => setToast(''), 2800);
  }

  async function updateMoisture(id, value) {
    const moisture = Math.max(0, Math.min(100, Number(value)));
    setFields((current) => current.map((field) => field.id === id ? {
      ...field, moisture, status: moisture < field.threshold ? 'Needs water' : moisture > field.threshold + 25 ? 'Moist' : 'Looking good', updated: 'Just now'
    } : field));

    if (storageMode === 'database') {
      try {
        await apiRequest('/soil-readings', {
          method: 'POST',
          body: JSON.stringify({ fieldId: id, moisture })
        });
        const remoteFields = await apiRequest('/fields');
        setFields(remoteFields.map(mapApiField));
        notify('Moisture reading saved to PostgreSQL');
      } catch {
        notify('Reading changed locally, but could not save it to the database');
      }
    } else {
      notify('Moisture reading updated in demo mode');
    }
  }

  async function startIrrigation(field) {
    const water = Math.round(field.area * 175);
    if (storageMode === 'database') {
      try {
        await apiRequest('/irrigation', {
          method: 'POST',
          body: JSON.stringify({ fieldId: field.id, durationMinutes: 20, method: 'drip' })
        });
        const [remoteFields, remoteLogs] = await Promise.all([
          apiRequest('/fields'),
          apiRequest('/irrigation/history')
        ]);
        setFields(remoteFields.map(mapApiField));
        setLogs(remoteLogs.map(mapApiLog));
        notify(`Simulated irrigation saved · ${money(water)} L`);
        return;
      } catch {
        notify('Could not save irrigation. Check the API and database connection.');
        return;
      }
    }

    const log = { id: Date.now(), field: field.name, date: 'Just now', duration: 20, water, method: 'Drip' };
    setLogs((current) => [log, ...current]);
    setFields((current) => current.map((item) => item.id === field.id ? {
      ...item, moisture: Math.min(100, item.moisture + 18), updated: 'Just now'
    } : item));
    notify(`Simulated irrigation recorded for ${field.name} · ${money(water)} L`);
  }

  async function addField(event) {
    event.preventDefault();
    if (!form.name.trim() || !Number(form.area) || Number(form.area) <= 0) return;
    const crop = crops.find((item) => item.name === form.crop);

    if (storageMode === 'database') {
      try {
        const cropRows = await apiRequest('/crops');
        const selectedCrop = cropRows.find((item) => item.name === form.crop);
        if (!selectedCrop) throw new Error('Selected crop was not found in the database.');
        const created = await apiRequest('/fields', {
          method: 'POST',
          body: JSON.stringify({
            name: form.name.trim(), cropId: selectedCrop.id,
            area: Number(form.area), soilType: form.soil
          })
        });
        await apiRequest('/soil-readings', {
          method: 'POST',
          body: JSON.stringify({ fieldId: created.id, moisture: Math.max(10, crop.min - 4) })
        });
        const remoteFields = await apiRequest('/fields');
        setFields(remoteFields.map(mapApiField));
        setSelectedField(created.id);
        setForm({ name: '', crop: 'Tomato', area: '', soil: 'Loamy' });
        setShowAdd(false);
        notify('New field saved to PostgreSQL');
        return;
      } catch (error) {
        notify(error.message || 'Could not save the new field.');
        return;
      }
    }

    const field = {
      id: Date.now(), name: form.name.trim(), crop: form.crop, area: Number(form.area),
      soil: form.soil, moisture: Math.max(10, crop.min - 4), threshold: crop.min,
      status: 'Needs water', updated: 'Just now'
    };
    setFields((current) => [...current, field]);
    setSelectedField(field.id);
    setForm({ name: '', crop: 'Tomato', area: '', soil: 'Loamy' });
    setShowAdd(false);
    notify('New field added in demo mode');
  }

  const filteredFields = useMemo(() => fields.filter((field) =>
    field.name.toLowerCase().includes(search.toLowerCase()) ||
    field.crop.toLowerCase().includes(search.toLowerCase())
  ), [fields, search]);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand"><div className="brand-mark"><Sprout size={22} /></div><div><strong>AgroSmart</strong><span>PRECISION FARMING</span></div><button className="mobile-close icon-button" onClick={() => setMobileNav(false)}><X size={18}/></button></div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav">
          {navItems.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-link ${active === id ? 'active' : ''}`} onClick={() => { setActive(id); setMobileNav(false); }}><Icon size={18}/><span>{label}</span>{id === 'fields' && <small>{fields.length}</small>}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><div className="help-icon"><CircleHelp size={17}/></div><strong>Need a hand?</strong><p>Learn how to get the most from your farm dashboard.</p><button onClick={() => notify('Help centre is coming soon')}>Visit help centre <ArrowUpRight size={14}/></button></div>
          <button className="nav-link settings-link" onClick={() => notify('Settings are coming soon')}><Settings size={18}/>Settings</button>
          <div className="profile"><div className="avatar">SS</div><div><strong>Shivam Singh</strong><span>Farm manager</span></div><MoreHorizontal size={19} className="profile-more"/></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu icon-button" onClick={() => setMobileNav(true)}><Menu size={20}/></button>
          <div className="breadcrumb">Workspace <span>/</span> <strong>{navItems.find((item) => item.id === active)?.label}</strong></div>
          <div className="top-actions"><div className="demo-pill"><span/> {storageMode === 'database' ? 'DATABASE CONNECTED' : storageMode === 'checking' ? 'CONNECTING' : 'DEMO MODE'}</div><button className="icon-button notification" onClick={() => notify(`${needsWater} field(s) need attention`)}><Bell size={19}/><i/></button><div className="top-avatar">SS</div></div>
        </header>

        <div className="page-content">
          {active === 'overview' && <Overview fields={fields} logs={logs} totalArea={totalArea} waterUsed={waterUsed} needsWater={needsWater} onNavigate={setActive} onAdd={() => setShowAdd(true)} onIrrigate={startIrrigation}/>}
          {active === 'fields' && <FieldsPage fields={filteredFields} search={search} setSearch={setSearch} onAdd={() => setShowAdd(true)} onSelect={(id) => { setSelectedField(id); setActive('monitoring'); }}/>}
          {active === 'monitoring' && <MonitoringPage fields={fields} selected={selected} onSelect={setSelectedField} onUpdate={updateMoisture}/>}
          {active === 'irrigation' && <IrrigationPage fields={fields} logs={logs} onIrrigate={startIrrigation}/>}
          {active === 'analytics' && <AnalyticsPage fields={fields} logs={logs} totalArea={totalArea} waterUsed={waterUsed}/>}
          <footer className="footer"><span>© 2026 AgroSmart</span><span><span className="live-dot"/> All systems operational <i/> Made for smarter farming</span></footer>
        </div>
      </main>

      {showAdd && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowAdd(false); }}><form className="modal" onSubmit={addField}><div className="modal-head"><div><span className="eyebrow">FARM MANAGEMENT</span><h2>Add a new field</h2><p>Set up a field to start tracking its moisture and irrigation.</p></div><button type="button" className="icon-button" onClick={() => setShowAdd(false)}><X size={19}/></button></div><label>Field name<input autoFocus placeholder="e.g. South Farm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required/></label><div className="form-row"><label>Crop<select value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })}>{crops.map((crop) => <option key={crop.name}>{crop.name}</option>)}</select></label><label>Area (acres)<input type="number" min="0.1" step="0.1" placeholder="2.5" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} required/></label></div><label>Soil type<select value={form.soil} onChange={(e) => setForm({ ...form, soil: e.target.value })}><option>Loamy</option><option>Sandy</option><option>Sandy loam</option><option>Clay</option><option>Silty</option></select></label><div className="modal-actions"><button type="button" className="button button-light" onClick={() => setShowAdd(false)}>Cancel</button><button type="submit" className="button button-primary"><Plus size={16}/> Add field</button></div></form></div>}
      {toast && <div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
    </div>
  );
}

function PageTitle({ eyebrow, title, subtitle, action }) {
  return <div className="page-title-row"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>;
}

function Overview({ fields, logs, totalArea, waterUsed, needsWater, onNavigate, onAdd, onIrrigate }) {
  const avg = Math.round(fields.reduce((sum, field) => sum + field.moisture, 0) / Math.max(fields.length, 1));
  return <>
    <div className="welcome-banner"><div><div className="eyebrow light-eyebrow">SUNDAY, NOVEMBER 15, 2026 <span/> FARM OVERVIEW</div><h1>Good afternoon, Shivam <span>🌱</span></h1><p>Here's what's happening across your fields today.</p></div><div className="banner-weather"><div className="weather-sun"><Sun size={25}/></div><div><strong>28° C</strong><span>Partly sunny · Pune</span></div></div><div className="banner-leaf leaf-one">✳</div><div className="banner-leaf leaf-two">✳</div></div>
    <div className="section-heading"><div><h2>Your farm at a glance</h2><p>Live summary from your latest field entries</p></div><button className="text-button" onClick={() => onNavigate('analytics')}>View analytics <ArrowUpRight size={15}/></button></div>
    <div className="stat-grid">
      <StatCard label="Total field area" value={totalArea.toFixed(1)} unit="acres" hint="Across all your fields" icon={MapPin} tone="green" trend="+0.8" />
      <StatCard label="Average soil moisture" value={avg} unit="%" hint="Across monitored fields" icon={Gauge} tone="blue" trend="+3.2%" />
      <StatCard label="Water used" value={money(waterUsed)} unit="litres" hint="Recorded irrigation" icon={Droplets} tone="aqua" trend="-12%" down />
      <StatCard label="Fields need attention" value={needsWater} unit={needsWater === 1 ? 'field' : 'fields'} hint="Below crop moisture target" icon={AlertTriangle} tone="orange" trend={needsWater ? 'Action needed' : 'All good'} alert />
    </div>
    <div className="content-grid overview-grid">
      <section className="panel fields-panel"><div className="panel-header"><div><h3>Field overview</h3><p>Monitor the condition of each field</p></div><button className="small-outline" onClick={() => onNavigate('fields')}>All fields <ArrowUpRight size={14}/></button></div><div className="field-list">{fields.slice(0, 4).map((field) => <FieldRow key={field.id} field={field} onClick={() => onNavigate('monitoring')}/>)}</div></section>
      <section className="panel recommendation-panel"><div className="panel-header"><div><h3>Smart recommendations</h3><p>Based on your latest moisture readings</p></div><span className="spark-icon"><Activity size={17}/></span></div><div className="recommendation-list">{fields.filter((field) => getIrrigationRecommendation(field.moisture, field.threshold).level !== 'success').slice(0, 3).map((field) => <Recommendation key={field.id} field={field} onIrrigate={onIrrigate}/>)}</div>{needsWater === 0 && <div className="empty-state"><CheckCircle2 size={22}/><strong>All fields look healthy</strong><span>No irrigation action is needed right now.</span></div>}<div className="recommendation-note"><span>i</span> Recommendations use sample crop thresholds. Adjust them for local conditions.</div></section>
    </div>
    <div className="bottom-grid"><section className="panel chart-panel"><div className="panel-header"><div><h3>Soil moisture levels</h3><p>Current moisture by field</p></div><span className="chart-legend"><i/> Moisture level</span></div><MoistureChart fields={fields}/></section><section className="panel activity-panel"><div className="panel-header"><div><h3>Recent irrigation</h3><p>Your latest water usage records</p></div><button className="icon-button" onClick={() => onNavigate('irrigation')}><ArrowUpRight size={17}/></button></div>{logs.slice(0, 3).map((log) => <div className="activity-row" key={log.id}><div className="activity-icon"><Droplets size={17}/></div><div className="activity-info"><strong>{log.field}</strong><span>{log.date} · {log.method}</span></div><div className="activity-amount"><strong>{money(log.water)} L</strong><span>{log.duration} min</span></div></div>)}</section></div>
    <div className="quick-tip"><div className="tip-icon"><CloudSun size={20}/></div><div><strong>Today's farming tip</strong><p>Check soil moisture early in the morning. Cooler temperatures can reduce evaporation during irrigation.</p></div><span className="tip-tag">FIELD NOTE 01</span></div>
  </>;
}

function StatCard({ label, value, unit, hint, icon: Icon, tone, trend, down, alert }) {
  return <div className="stat-card"><div className="stat-top"><span>{label}</span><div className={`stat-icon ${tone}`}><Icon size={18}/></div></div><div className="stat-value">{value}<small>{unit}</small></div><div className="stat-bottom"><span>{hint}</span><em className={alert ? 'trend-alert' : down ? 'trend-down' : ''}>{down ? <ArrowDownRight size={13}/> : <ArrowUpRight size={13}/>} {trend}</em></div></div>;
}

function FieldRow({ field, onClick }) {
  const rec = getIrrigationRecommendation(field.moisture, field.threshold);
  return <button className="field-row" onClick={onClick}><div className="crop-avatar">{crops.find((crop) => crop.name === field.crop)?.icon || '🌱'}</div><div className="field-name"><strong>{field.name}</strong><span>{field.crop} · {field.area} acres</span></div><div className="field-moisture"><strong>{field.moisture}%</strong><span>Soil moisture</span></div><div className="mini-progress"><div style={{ width: `${field.moisture}%` }} className={field.moisture < field.threshold ? 'bar-low' : ''}/></div><div className={`status-pill ${rec.level}`}>{rec.status}</div><ChevronDown className="row-arrow" size={16}/></button>;
}

function Recommendation({ field, onIrrigate }) {
  const rec = getIrrigationRecommendation(field.moisture, field.threshold);
  return <div className="recommendation-item"><div className="recommend-icon"><Droplets size={17}/></div><div className="recommend-text"><strong>{field.name}</strong><span>{rec.message}</span></div><button onClick={() => onIrrigate(field)} className="recommend-action">Irrigate</button></div>;
}

function MoistureChart({ fields }) {
  return <div className="moisture-chart"><div className="chart-scale"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div><div className="chart-columns">{fields.map((field) => <div className="chart-column" key={field.id}><div className="column-track"><div className={`column-fill ${field.moisture < field.threshold ? 'column-warning' : ''}`} style={{ height: `${field.moisture}%` }}><span>{field.moisture}%</span></div></div><span className="column-label">{field.name}</span></div>)}</div></div>;
}

function FieldsPage({ fields, search, setSearch, onAdd, onSelect }) {
  return <><PageTitle eyebrow="FARM MANAGEMENT" title="My fields" subtitle="Keep your fields, crops and soil conditions organised." action={<button className="button button-primary" onClick={onAdd}><Plus size={16}/> Add new field</button>}/><div className="toolbar"><div className="search-box"><Search size={17}/><input placeholder="Search fields or crops..." value={search} onChange={(e) => setSearch(e.target.value)}/></div><span className="muted-count">{fields.length} fields found</span></div><div className="field-card-grid">{fields.map((field) => <button className="field-card panel" key={field.id} onClick={() => onSelect(field.id)}><div className="field-card-top"><div className="crop-avatar large">{crops.find((crop) => crop.name === field.crop)?.icon || '🌱'}</div><span className={`status-pill ${getIrrigationRecommendation(field.moisture, field.threshold).level}`}>{getIrrigationRecommendation(field.moisture, field.threshold).status}</span></div><h3>{field.name}</h3><p>{field.crop} · {field.soil} soil</p><div className="field-card-meta"><span><MapPin size={14}/> {field.area} acres</span><span><Clock3 size={14}/> {field.updated}</span></div><div className="field-card-progress"><div className="progress-label"><span>Soil moisture</span><strong>{field.moisture}%</strong></div><div className="progress-track"><div style={{ width: `${field.moisture}%` }} className={field.moisture < field.threshold ? 'bar-low' : ''}/></div><small>Crop target: {field.threshold}% minimum</small></div><div className="field-card-link">View field details <ArrowUpRight size={15}/></div></button>)}</div>{fields.length === 0 && <div className="panel empty-large">No fields match your search.</div>}</>;
}

function MonitoringPage({ fields, selected, onSelect, onUpdate }) {
  const [draft, setDraft] = useState(selected?.moisture ?? 0);
  const [rain, setRain] = useState(false);
  const [fieldKey, setFieldKey] = useState(selected?.id);
  const current = fields.find((field) => field.id === fieldKey) || selected;
  const crop = crops.find((item) => item.name === current?.crop);
  const rec = current ? getIrrigationRecommendation(current.moisture, current.threshold, rain) : null;
  function choose(id) { setFieldKey(id); onSelect(id); setDraft(fields.find((field) => field.id === id)?.moisture ?? 0); }
  return <><PageTitle eyebrow="FIELD SENSORS · SIMULATED" title="Soil monitoring" subtitle="Enter a manual reading to simulate a field sensor. No hardware required." action={<span className="demo-pill"><span/> MANUAL INPUT</span>}/><div className="monitor-layout"><section className="panel monitor-main"><div className="panel-header"><div><h3>Field moisture reading</h3><p>Select a field and update its latest reading</p></div><div className="manual-tag"><Activity size={14}/> Manual</div></div><label className="select-label">SELECT FIELD<select value={fieldKey} onChange={(e) => choose(Number(e.target.value))}>{fields.map((field) => <option value={field.id} key={field.id}>{field.name} · {field.crop}</option>)}</select></label><div className="moisture-reading"><div className="reading-circle" style={{ '--moisture': `${current?.moisture || 0}%` }}><div><strong>{current?.moisture ?? 0}<small>%</small></strong><span>Current moisture</span></div></div><div className="reading-details"><span className="eyebrow">CROP REQUIREMENT</span><h2>{crop?.icon} {current?.crop}</h2><p>{current?.soil} soil · {current?.area} acres</p><div className="target-range"><span>Minimum target</span><strong>{current?.threshold}%</strong></div><div className="target-range"><span>Last updated</span><strong>{current?.updated}</strong></div></div></div><div className="range-editor"><div className="range-heading"><label>NEW MOISTURE READING</label><strong>{draft}%</strong></div><input type="range" min="0" max="100" value={draft} onChange={(e) => setDraft(Number(e.target.value))}/><div className="range-labels"><span>0% · Dry</span><span>100% · Saturated</span></div><label className="rain-toggle"><input type="checkbox" checked={rain} onChange={(e) => setRain(e.target.checked)}/> Rain expected soon <span>Include rainfall in the recommendation</span></label><button className="button button-primary full-button" onClick={() => { onUpdate(current.id, draft); }}>Save moisture reading <CheckCircle2 size={16}/></button></div></section><section className="panel decision-panel"><div className="panel-header"><div><h3>Smart recommendation</h3><p>Rule-based decision support</p></div><span className="spark-icon"><Activity size={17}/></span></div><div className={`decision-status ${rec?.level}`}><div className="decision-icon">{rec?.level === 'warning' ? <AlertTriangle size={20}/> : <CheckCircle2 size={20}/>}</div><div><strong>{rec?.status}</strong><span>{rec?.message}</span></div></div><div className="decision-facts"><div><span>Current moisture</span><strong>{current?.moisture}%</strong></div><div><span>Minimum target</span><strong>{current?.threshold}%</strong></div><div><span>Rainfall factor</span><strong>{rain ? 'Expected' : 'Not included'}</strong></div></div><div className="logic-note"><strong>How this is decided</strong><p>The system compares your manual reading with the crop's configured minimum moisture target. Rainfall can delay watering when moisture is close to the target.</p></div><div className="sample-warning"><AlertTriangle size={15}/> Sample thresholds only. Calibrate for your crop and soil.</div></section></div><section className="panel readings-table"><div className="panel-header"><div><h3>All field readings</h3><p>Latest moisture value saved for each field</p></div></div><div className="table-wrap"><table><thead><tr><th>FIELD</th><th>CROP</th><th>MOISTURE</th><th>TARGET MIN.</th><th>STATUS</th><th>UPDATED</th></tr></thead><tbody>{fields.map((field) => <tr key={field.id}><td><strong>{field.name}</strong></td><td>{field.crop}</td><td><strong>{field.moisture}%</strong></td><td>{field.threshold}%</td><td><span className={`status-pill ${getIrrigationRecommendation(field.moisture, field.threshold).level}`}>{getIrrigationRecommendation(field.moisture, field.threshold).status}</span></td><td>{field.updated}</td></tr>)}</tbody></table></div></section></>;
}

function IrrigationPage({ fields, logs, onIrrigate }) {
  return <><PageTitle eyebrow="WATER MANAGEMENT" title="Irrigation control" subtitle="Run a safe software simulation and keep a record of water used." action={<span className="demo-pill"><span/> SIMULATION ONLY</span>}/><div className="irrigation-banner"><div className="irrigation-watermark"><Waves size={94}/></div><div className="eyebrow light-eyebrow">SIMULATED WATER CONTROL</div><h2>Manage irrigation, one field at a time.</h2><p>Starting irrigation here records a sample water-use entry and increases the field's simulated moisture reading. No physical pump is connected.</p></div><div className="section-heading"><div><h2>Field irrigation</h2><p>Select a field to record a simulated irrigation event</p></div></div><div className="irrigation-grid">{fields.map((field) => { const rec = getIrrigationRecommendation(field.moisture, field.threshold); return <div className="panel irrigation-card" key={field.id}><div className="irrigation-card-head"><div className="crop-avatar">{crops.find((crop) => crop.name === field.crop)?.icon || '🌱'}</div><span className={`status-pill ${rec.level}`}>{rec.status}</span></div><h3>{field.name}</h3><p>{field.crop} · {field.area} acres</p><div className="irrigation-moisture"><span>Soil moisture</span><strong>{field.moisture}%</strong></div><div className="progress-track"><div style={{ width: `${field.moisture}%` }} className={field.moisture < field.threshold ? 'bar-low' : ''}/></div><button className="button button-primary full-button" onClick={() => onIrrigate(field)}><Play size={15} fill="currentColor"/> Simulate irrigation</button><small>Est. {money(Math.round(field.area * 175))} L · 20 min simulation</small></div>; })}</div><section className="panel readings-table"><div className="panel-header"><div><h3>Irrigation history</h3><p>Recorded simulation events</p></div><span className="table-count">{logs.length} records</span></div><LogsTable logs={logs}/></section></>;
}

function LogsTable({ logs }) {
  return <div className="table-wrap"><table><thead><tr><th>FIELD</th><th>DATE & TIME</th><th>METHOD</th><th>DURATION</th><th>WATER USED</th><th>STATUS</th></tr></thead><tbody>{logs.map((log) => <tr key={log.id}><td><strong>{log.field}</strong></td><td>{log.date}</td><td>{log.method}</td><td>{log.duration} min</td><td><strong>{money(log.water)} L</strong></td><td><span className="status-pill success">Completed</span></td></tr>)}</tbody></table>{logs.length === 0 && <div className="empty-large">No irrigation events recorded yet.</div>}</div>;
}

function AnalyticsPage({ fields, logs, totalArea, waterUsed }) {
  const average = Math.round(fields.reduce((sum, field) => sum + field.moisture, 0) / Math.max(fields.length, 1));
  return <><PageTitle eyebrow="FARM INSIGHTS" title="Analytics" subtitle="A simple view of moisture and simulated water consumption." action={<span className="demo-pill"><span/> SAMPLE DATA</span>}/><div className="stat-grid analytics-stats"><StatCard label="Total water recorded" value={money(waterUsed)} unit="litres" hint="Across all simulation events" icon={Droplets} tone="aqua" trend="All time"/><StatCard label="Farm area" value={totalArea.toFixed(1)} unit="acres" hint="Combined field area" icon={MapPin} tone="green" trend={`${fields.length} fields`}/><StatCard label="Average moisture" value={average} unit="%" hint="Latest values by field" icon={Gauge} tone="blue" trend="Current"/></div><div className="bottom-grid analytics-grid"><section className="panel chart-panel"><div className="panel-header"><div><h3>Moisture by field</h3><p>Current reading compared with 100%</p></div></div><MoistureChart fields={fields}/></section><section className="panel chart-panel"><div className="panel-header"><div><h3>Water used by field</h3><p>Based on recorded simulation logs</p></div></div><div className="water-bars">{fields.map((field) => { const value = logs.filter((log) => log.field === field.name).reduce((sum, log) => sum + log.water, 0); const max = Math.max(...fields.map((item) => logs.filter((log) => log.field === item.name).reduce((sum, log) => sum + log.water, 0)), 1); return <div className="water-bar-row" key={field.id}><span>{field.name}</span><div className="water-track"><div style={{ width: `${(value / max) * 100}%` }}/></div><strong>{money(value)} L</strong></div>; })}</div></section></div><section className="panel readings-table"><div className="panel-header"><div><h3>Water-use records</h3><p>All recorded irrigation events</p></div></div><LogsTable logs={logs}/></section><div className="sample-warning analytics-warning"><AlertTriangle size={15}/> Analytics are calculated from sample/demo data stored in this browser session. Database persistence will be enabled after PostgreSQL setup.</div></>;
}

export default App;
