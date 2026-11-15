import { useEffect, useState } from 'react';
import { CalendarClock, Check, CircleAlert, X } from 'lucide-react';
import { apiRequest } from '../services.js';

function getDefaultDateTime() {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function formatDate(value) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

export default function SchedulePanel({ fields, storageMode }) {
  const [schedules, setSchedules] = useState([]);
  const [fieldId, setFieldId] = useState('');
  const [scheduledFor, setScheduledFor] = useState(getDefaultDateTime);
  const [durationMinutes, setDurationMinutes] = useState('20');
  const [method, setMethod] = useState('drip');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!fieldId && fields.length) setFieldId(String(fields[0].id));
  }, [fields, fieldId]);

  useEffect(() => {
    if (storageMode !== 'database') return;

    let active = true;
    apiRequest('/irrigation/schedules')
      .then((rows) => {
        if (active) setSchedules(rows);
      })
      .catch(() => {
        if (active) setMessage('Could not load saved schedules. Check the API connection.');
      });

    return () => { active = false; };
  }, [storageMode]);

  async function saveSchedule(event) {
    event.preventDefault();
    setMessage('');

    const selectedDate = new Date(scheduledFor);
    const minutes = Number(durationMinutes);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 240) {
      setMessage('Duration must be between 1 and 240 minutes.');
      return;
    }
    if (!fieldId || Number.isNaN(selectedDate.getTime()) || selectedDate <= new Date()) {
      setMessage('Choose a field and a date/time in the future.');
      return;
    }

    const schedule = {
      fieldId: Number(fieldId),
      scheduledFor: selectedDate.toISOString(),
      durationMinutes: Number(durationMinutes),
      method,
      notes: notes.trim()
    };

    setSaving(true);
    try {
      if (storageMode === 'database') {
        const created = await apiRequest('/irrigation/schedules', {
          method: 'POST',
          body: JSON.stringify(schedule)
        });
        setSchedules((current) => [...current, created].sort(
          (a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor)
        ));
      } else {
        const field = fields.find((item) => item.id === Number(fieldId));
        setSchedules((current) => [...current, {
          ...schedule,
          id: Date.now(),
          status: 'pending',
          field: { id: Number(fieldId), name: field?.name || 'Field' }
        }].sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor)));
      }

      setScheduledFor(getDefaultDateTime());
      setDurationMinutes('20');
      setMethod('drip');
      setNotes('');
      setMessage('Irrigation plan saved.');
    } catch (error) {
      setMessage(error.message || 'Could not save this plan.');
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(schedule, status) {
    try {
      if (storageMode === 'database') {
        const updated = await apiRequest(`/irrigation/schedules/${schedule.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status })
        });
        setSchedules((current) => current.map((item) => item.id === updated.id ? updated : item));
      } else {
        setSchedules((current) => current.map((item) =>
          item.id === schedule.id ? { ...item, status } : item
        ));
      }
      setMessage(status === 'completed' ? 'Plan marked as completed.' : 'Plan cancelled.');
    } catch (error) {
      setMessage(error.message || 'Could not update this plan.');
    }
  }

  return (
    <>
      <div className="page-title-row">
        <div>
          <div className="eyebrow">WATER MANAGEMENT</div>
          <h1>Irrigation planner</h1>
          <p>Plan upcoming watering runs and keep track of what is due.</p>
        </div>
        <span className="demo-pill"><span /> {storageMode === 'database' ? 'SAVED TO DATABASE' : 'DEMO PLANS'}</span>
      </div>

      <div className="schedule-layout">
        <form className="panel schedule-form" onSubmit={saveSchedule}>
          <div className="panel-header">
            <div>
              <h3>Plan a watering run</h3>
              <p>This creates a plan only. It does not switch on a pump.</p>
            </div>
            <span className="spark-icon"><CalendarClock size={17} /></span>
          </div>

          <label className="select-label">
            SELECT FIELD
            <select value={fieldId} onChange={(event) => setFieldId(event.target.value)} required>
              {fields.map((field) => (
                <option key={field.id} value={field.id}>{field.name} · {field.crop}</option>
              ))}
            </select>
          </label>

          <label className="schedule-label">
            DATE AND TIME
            <input
              type="datetime-local"
              min={getDefaultDateTime()}
              value={scheduledFor}
              onChange={(event) => setScheduledFor(event.target.value)}
              required
            />
          </label>

          <div className="form-row">
            <label className="schedule-label">
              DURATION (MINUTES)
              <input
                type="number"
                min="1"
                max="240"
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
                required
              />
            </label>
            <label className="schedule-label">
              METHOD
              <select value={method} onChange={(event) => setMethod(event.target.value)}>
                <option value="drip">Drip</option>
                <option value="sprinkler">Sprinkler</option>
                <option value="flood">Flood</option>
              </select>
            </label>
          </div>

          <label className="schedule-label">
            NOTES (OPTIONAL)
            <textarea
              rows="3"
              maxLength="180"
              placeholder="Example: water the north section first"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>

          <button className="button button-primary full-button" type="submit" disabled={saving || !fields.length}>
            <CalendarClock size={16} /> {saving ? 'Saving plan...' : 'Save irrigation plan'}
          </button>

          {message && <p className="schedule-message" role="status">{message}</p>}
        </form>

        <section className="panel schedule-list">
          <div className="panel-header">
            <div>
              <h3>Upcoming and recent plans</h3>
              <p>{schedules.filter((item) => item.status === 'pending').length} waiting for action</p>
            </div>
            <span className="table-count">{schedules.length} plans</span>
          </div>

          {schedules.length === 0 ? (
            <div className="empty-large">
              <CalendarClock size={25} />
              <p>No irrigation plans yet.</p>
            </div>
          ) : (
            <div className="schedule-items">
              {schedules.map((schedule) => (
                <article className="schedule-item" key={schedule.id}>
                  <div className="schedule-date-icon"><CalendarClock size={17} /></div>
                  <div className="schedule-details">
                    <strong>{schedule.field?.name || fields.find((field) => field.id === schedule.fieldId)?.name || 'Field'}</strong>
                    <span>{formatDate(schedule.scheduledFor)} · {schedule.durationMinutes} min · {schedule.method}</span>
                    {schedule.notes && <p>{schedule.notes}</p>}
                    <span className={`status-pill ${schedule.status === 'pending' ? 'info' : schedule.status === 'completed' ? 'success' : 'warning'}`}>
                      {schedule.status}
                    </span>
                  </div>
                  {schedule.status === 'pending' && (
                    <div className="schedule-actions">
                      <button type="button" title="Mark completed" onClick={() => changeStatus(schedule, 'completed')}><Check size={15} /></button>
                      <button type="button" title="Cancel plan" onClick={() => changeStatus(schedule, 'cancelled')}><X size={15} /></button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="sample-warning schedule-warning">
        <CircleAlert size={15} />
        Schedules are reminders stored in the app. They are not automatic pump controls or notifications.
      </div>
    </>
  );
}
