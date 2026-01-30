'use client';
import { useEffect, useState } from 'react';
import { defaultState, loadConsent, saveConsent } from '../lib/cookieConsent';

export default function CookiePreferences() {
  const [state, setState] = useState(defaultState);

  useEffect(() => {
    const loaded = loadConsent();
    if (loaded) setState(loaded);
  }, []);

  const toggle = (key) => {
    if (key === 'necessary') return; // devre dışı bırakılamaz
    setState((s) => ({ ...s, [key]: !s[key] }));
  };

  const acceptAll = () => setState({ ...defaultState, functional: true, analytics: true, advertising: true });
  const rejectAll = () => setState({ ...defaultState, functional: false, analytics: false, advertising: false });
  const save = () => { saveConsent(state); alert('Preferences saved.'); };

  return (
    <div className="container py-4" style={{maxWidth: 720}}>
      <h1 className="mb-2">Cookie Preferences</h1>
      <p>Manage your preferences below. Non‑essential cookies will only be set if you enable them.</p>

      <ul className="list-group mb-3">
        <li className="list-group-item d-flex justify-content-between align-items-start">
          <div><strong>Strictly Necessary</strong><br/>Required for core site functionality (security, session, load balancing). Cannot be disabled.</div>
          <div className="form-check form-switch">
            <input className="form-check-input" type="checkbox" checked readOnly aria-label="Toggle Strictly Necessary cookies" />
          </div>
        </li>

        {[
          ['functional','Functional','Remember your settings (language, UI choices).'],
          ['analytics','Analytics','Help us understand usage and improve performance.'],
          ['advertising','Advertising','Deliver more relevant ads and measure campaigns.'],
        ].map(([key,label,desc]) => (
          <li key={key} className="list-group-item d-flex justify-content-between align-items-start">
            <div><strong>{label}</strong><br/>{desc}</div>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={!!state[key]}
                onChange={() => toggle(key)}
                aria-label={`Toggle ${label} cookies`}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="d-flex gap-2">
        <button className="btn btn-primary" onClick={save}>Save Preferences</button>
        <button className="btn btn-outline-secondary" onClick={acceptAll}>Accept All</button>
        <button className="btn btn-outline-dark" onClick={rejectAll}>Reject All</button>
      </div>
    </div>
  );
}
