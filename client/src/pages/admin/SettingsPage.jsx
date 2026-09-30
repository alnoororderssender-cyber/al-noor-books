import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAdminError, useAdminLoader } from '../../hooks/useAdmin';
import { useToast } from '../../context/ToastContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { PageHeader } from '../../components/admin/AdminUI';
import { ErrorState, InlineAlert, PageLoader, Spinner } from '../../components/ui/States';
import { useSettings } from '../../context/SettingsContext';

/**
 * One reusable form for Announcement, Delivery, Payment and Store Info.
 * fields: [{ name, label, type?: 'text'|'number'|'textarea', help?, placeholder? }]
 * group: null for top-level keys, or 'payment' | 'store' for nested keys.
 */
export default function SettingsPage({ title, subtitle, fields, group = null, preview, notice }) {
  usePageTitle(title);
  const { data, loading, error, reload } = useAdminLoader(() => api.admin.settings(), []);
  const [values, setValues] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const { notify } = useToast();
  const fail = useAdminError();
  useSettings(); // storefront reads its own copy on reload

  const read = (src) => Object.fromEntries(fields.map((f) => [f.name, String((group ? src[group] : src)?.[f.name] ?? '')]));
  useEffect(() => { if (data) setValues(read(data)); }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && !values) return <PageLoader />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (!values) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    const errs = {};
    const body = {};
    for (const f of fields) {
      const raw = values[f.name].trim();
      if (f.type === 'number') {
        if (!/^\d+$/.test(raw)) errs[f.name] = 'Enter a whole number (0 or more).';
        body[f.name] = Number(raw);
      } else {
        if (f.required && !raw) errs[f.name] = 'This field is required.';
        body[f.name] = raw;
      }
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const saved = await api.admin.updateSettings(group ? { [group]: body } : body);
      setValues(read(saved));
      notify(`${title} saved. Changes are live on the store.`);
    } catch (err) {
      if (err.status === 401) fail(err); else { setErrors(err.errors || {}); fail(err); }
    } finally { setSaving(false); }
  };

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      {notice && <InlineAlert tone="info" className="mb-5 max-w-2xl">{notice}</InlineAlert>}
      <form onSubmit={submit} noValidate className="card max-w-2xl space-y-5 p-5 sm:p-7">
        {fields.map((f) => (
          <div key={f.name}>
            <label htmlFor={`f-${f.name}`} className="label">{f.label}{f.required && <span className="text-danger"> *</span>}</label>
            {f.type === 'textarea' ? (
              <textarea id={`f-${f.name}`} rows={3} className={`input ${errors[f.name] ? 'input-error' : ''}`} value={values[f.name]} placeholder={f.placeholder} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />
            ) : (
              <input id={`f-${f.name}`} inputMode={f.type === 'number' ? 'numeric' : undefined} maxLength={f.max || 300} className={`input ${errors[f.name] ? 'input-error' : ''}`} value={values[f.name]} placeholder={f.placeholder}
                onChange={(e) => setValues({ ...values, [f.name]: f.type === 'number' ? e.target.value.replace(/[^\d]/g, '') : e.target.value })} />
            )}
            {f.help && <p className="mt-1.5 text-xs text-muted">{f.help}</p>}
            {errors[f.name] && <p className="field-error">{errors[f.name]}</p>}
          </div>
        ))}
        {preview && preview(values)}
        <div className="flex justify-end border-t border-line pt-5">
          <button type="submit" className="btn-primary min-w-[130px]" disabled={saving}>{saving ? <><Spinner /> Saving&hellip;</> : 'Save changes'}</button>
        </div>
      </form>
    </>
  );
}
