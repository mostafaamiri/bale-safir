import { useEffect, useMemo, useState } from 'react';
import { sendMessage, normalizePhone } from './api.js';
import { load, save } from './storage.js';

const LS_KEYS = {
  phones: 'bale.phones',
  botId: 'bale.botId',
  apiKey: 'bale.apiKey',
  lastText: 'bale.lastText'
};

function useLocalStorageState(key, initial) {
  const [state, setState] = useState(() => load(key, initial));
  useEffect(() => { save(key, state); }, [key, state]);
  return [state, setState];
}

function maskKey(value) {
  const key = String(value || '').trim();
  if (!key) return 'وارد نشده';
  if (key.length <= 4) return `${key}••`;
  if (key.length <= 8) return `${key.slice(0, 2)}••${key.slice(-2)}`;
  return `${key.slice(0, 4)}•••${key.slice(-4)}`;
}

export default function App() {
  const defaultBot = import.meta.env.VITE_DEFAULT_BOT_ID || '';
  const [botId, setBotId] = useLocalStorageState(LS_KEYS.botId, defaultBot);
  const [apiKey, setApiKey] = useLocalStorageState(LS_KEYS.apiKey, '');
  const [phones, setPhones] = useLocalStorageState(LS_KEYS.phones, []);
  const [message, setMessage] = useLocalStorageState(LS_KEYS.lastText, '');
  const [newPhone, setNewPhone] = useState('');
  const [selected, setSelected] = useState({});
  const [sending, setSending] = useState(false);
  const [logs, setLogs] = useState([]);
  const [configOpen, setConfigOpen] = useState(false);

  useEffect(() => {
    if (!botId || !apiKey) {
      setConfigOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mode = useMemo(
    () => (import.meta.env.VITE_DIRECT_API === 'true' ? 'direct' : 'dev-proxy'),
    []
  );

  const trimmedBot = String(botId || '').trim();
  const trimmedKey = apiKey.trim();
  const trimmedMessage = message.trim();

  const addLog = (line) => setLogs((l) => [...l, line]);
  const clearLogs = () => setLogs([]);

  const addPhone = () => {
    const normalized = normalizePhone(newPhone);
    if (!normalized) return;
    if (phones.includes(normalized)) {
      setNewPhone('');
      return;
    }
    setPhones([...phones, normalized]);
    setNewPhone('');
  };

  const removePhone = (p) => {
    setPhones(phones.filter((x) => x !== p));
    setSelected((s) => { const n = { ...s }; delete n[p]; return n; });
  };

  const toggleSelect = (p) => setSelected((s) => ({ ...s, [p]: !s[p] }));

  const selectedPhones = useMemo(
    () => phones.filter((p) => selected[p]),
    [phones, selected]
  );

  const canSend = Boolean(trimmedBot && trimmedKey && trimmedMessage && phones.length > 0);

  const doSend = async (targets) => {
    if (!canSend || sending) return;
    const list = targets.length ? targets : phones;
    setSending(true);
    clearLogs();
    addLog(`در حال ارسال برای ${list.length} مخاطب...`);

    try {
      const results = await Promise.allSettled(
        list.map((p) => sendMessage({
          botId: trimmedBot,
          phoneNumber: p,
          text: trimmedMessage,
          apiKey: trimmedKey
        }))
      );

      results.forEach((r, idx) => {
        const phone = list[idx];
        if (r.status === 'fulfilled') {
          addLog(`✓ ${phone}: ارسال شد`);
        } else {
          addLog(`✗ ${phone}: ${r.reason?.message || 'ناموفق'}`);
        }
      });
    } finally {
      setSending(false);
    }
  };

  const openConfig = () => setConfigOpen(true);
  const commitConfig = () => {
    setBotId(trimmedBot);
    setApiKey(trimmedKey);
    setConfigOpen(false);
  };

  return (
    <div className="container">
      <div className="panel" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
          <div>
            <div className="title">پنل ارسال پیام بله</div>
            <div className="muted">
              حالت: {mode === 'direct' ? 'ارتباط مستقیم (ارسال کلید از مرورگر)' : 'پروکسی توسعه (افزودن کلید در سرور)'}
            </div>
            <div className="status-line">
              <span className={`status ${trimmedBot ? 'good' : 'bad'}`}>
                شناسه ربات: {trimmedBot ? <span dir="ltr">{trimmedBot}</span> : 'وارد نشده'}
              </span>
              <span className={`status ${trimmedKey ? 'good' : 'bad'}`}>
                کلید API: {maskKey(trimmedKey)}
              </span>
            </div>
          </div>
          <button className="ghost" onClick={openConfig}>تنظیمات</button>
        </div>
      </div>

      <div className="row">
        <div className="col">
          <div className="panel">
            <div className="title">ربات و پیام</div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label>متن پیام</label>
                <textarea
                  dir="auto"
                  placeholder="متن پیام شما"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              {!trimmedBot && (
                <div className="bad" style={{ fontSize: 12 }}>
                  قبل از ارسال، شناسه ربات را در بخش تنظیمات وارد کنید.
                </div>
              )}

              {!trimmedKey && (
                <div className="bad" style={{ fontSize: 12 }}>
                  قبل از ارسال، کلید دسترسی API را در بخش تنظیمات وارد کنید.
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  className="primary"
                  disabled={!canSend || sending}
                  onClick={() => doSend([])}
                >
                  {sending ? 'در حال ارسال…' : 'ارسال برای همه'}
                </button>
                <button
                  disabled={!canSend || sending || selectedPhones.length === 0}
                  onClick={() => doSend(selectedPhones)}
                >
                  {sending ? 'در حال ارسال…' : `ارسال برای انتخاب‌شده‌ها (${selectedPhones.length})`}
                </button>
                <button className="ghost" onClick={openConfig}>باز کردن تنظیمات</button>
              </div>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="panel">
            <div className="title">شماره‌های مخاطب</div>
            <div className="row" style={{ gap: 8 }}>
              <div style={{ flex: '1 1 auto' }}>
                <label>شماره جدید</label>
                <input
                  dir="ltr"
                  placeholder="98912xxxxxxx یا 0912xxxxxxx"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addPhone(); }}
                />
              </div>
              <div>
                <label>&nbsp;</label>
                <button onClick={addPhone}>افزودن</button>
              </div>
            </div>

            <div className="phones" style={{ marginTop: 10 }}>
              {phones.length === 0 && <div className="muted">هنوز شماره‌ای اضافه نشده است.</div>}
              {phones.map((p) => (
                <div key={p} className="phone-item">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={!!selected[p]}
                      onChange={() => toggleSelect(p)}
                    />
                    <span dir="ltr">{p}</span>
                  </label>
                  <div className="phone-actions">
                    <button className="ghost" onClick={() => navigator.clipboard?.writeText(p)}>کپی</button>
                    <button className="danger" onClick={() => removePhone(p)}>حذف</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="title">گزارش ارسال</div>
        <div className="log" aria-live="polite">{logs.join('\n')}</div>
        <div className="footer">
          <span className="muted">برای مشاهده نتیجه، این برگه را باز نگه دارید.</span>
          <button className="ghost" onClick={clearLogs}>پاک کردن</button>
        </div>
      </div>

      {configOpen && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true" aria-label="تنظیمات">
            <div className="title" style={{ marginBottom: 0 }}>تنظیمات</div>
            <div className="muted">این اطلاعات فقط در همین مرورگر ذخیره می‌شود.</div>

            <div>
              <label>شناسه ربات</label>
              <input
                inputMode="numeric"
                placeholder="مثلاً 1234567890"
                value={trimmedBot}
                onChange={(e) => setBotId(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </div>

            <div>
              <label>کلید دسترسی API</label>
              <input
                type="password"
                placeholder="کلید Safir خود را وارد کنید"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button className="primary" onClick={commitConfig} disabled={!trimmedBot || !apiKey.trim()}>
                ذخیره و بستن
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="ghost" onClick={() => setApiKey('')}>حذف کلید</button>
                <button className="ghost" onClick={() => setConfigOpen(false)}>انصراف</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
