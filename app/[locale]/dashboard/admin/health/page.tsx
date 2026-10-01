'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import DashboardShell from '@/components/DashboardShell';
import { useDashboardReady } from '@/hooks/useDashboardAuth';
import {
  adminGetHealthSummary, adminGetInactiveUsers, adminGetNoVarroaApiaries, adminGetZeroInspectionHives,
  adminSelfTestError,
  type HealthSummary, type InactiveUser, type NoVarroaApiary, type ZeroInspectionHive, type Paginated,
  type CrashReportSelfTest,
} from '@/lib/api';

type Section = 'inactive' | 'zeroHives' | 'noVarroa';

export default function AdminHealthPage() {
  const t = useTranslations('dash');
  const ready = useDashboardReady();
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [section, setSection] = useState<Section | null>(null);
  const [inactiveData, setInactiveData] = useState<Paginated<InactiveUser> | null>(null);
  const [inactivePage, setInactivePage] = useState(1);
  const [noVarroaData, setNoVarroaData] = useState<NoVarroaApiary[]>([]);
  const [zeroHivesData, setZeroHivesData] = useState<ZeroInspectionHive[]>([]);
  const [loading, setLoading] = useState(true);
  const [drillLoading, setDrillLoading] = useState(false);

  useEffect(() => {
    if (!ready) return;
    adminGetHealthSummary()
      .then(setSummary)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ready]);

  useEffect(() => {
    if (!ready || !section) return;
    setDrillLoading(true);
    if (section === 'inactive') {
      adminGetInactiveUsers({ page: inactivePage, per_page: 20 })
        .then(setInactiveData)
        .catch(() => {})
        .finally(() => setDrillLoading(false));
    } else if (section === 'noVarroa') {
      adminGetNoVarroaApiaries()
        .then(setNoVarroaData)
        .catch(() => {})
        .finally(() => setDrillLoading(false));
    } else {
      adminGetZeroInspectionHives()
        .then(setZeroHivesData)
        .catch(() => {})
        .finally(() => setDrillLoading(false));
    }
  }, [ready, section, inactivePage]);

  return (
    <DashboardShell adminOnly>
      <h1 className="dash-page-title">{t('admin.health.title')}</h1>

      {loading && <div className="spinner" />}

      {!loading && summary && (
        <div className="dash-admin-health-cards">
          <HealthCard
            label={t('admin.health.inactiveUsers')}
            desc={t('admin.health.inactiveDesc')}
            count={summary.inactive_users}
            active={section === 'inactive'}
            onClick={() => setSection(section === 'inactive' ? null : 'inactive')}
          />
          <HealthCard
            label={t('admin.health.zeroHives')}
            desc={t('admin.health.zeroDesc')}
            count={summary.zero_inspection_hives}
            active={section === 'zeroHives'}
            onClick={() => setSection(section === 'zeroHives' ? null : 'zeroHives')}
          />
          <HealthCard
            label={t('admin.health.noVarroa')}
            desc={t('admin.health.noVarroaDesc')}
            count={summary.no_varroa_inspections}
            active={section === 'noVarroa'}
            onClick={() => setSection(section === 'noVarroa' ? null : 'noVarroa')}
          />
        </div>
      )}

      {drillLoading && <div className="spinner" style={{ marginTop: '1.5rem' }} />}

      {!drillLoading && section === 'inactive' && inactiveData && (
        <>
          <div className="dash-admin-table-wrap" style={{ marginTop: '1.5rem' }}>
            <table className="dash-admin-table">
              <thead><tr>
                <th>{t('admin.health.email')}</th>
                <th>{t('admin.health.joined')}</th>
                <th>{t('admin.health.apiaries')}</th>
              </tr></thead>
              <tbody>
                {inactiveData.items.length === 0
                  ? <tr><td colSpan={3} className="dash-empty">{t('admin.health.noData')}</td></tr>
                  : inactiveData.items.map(u => (
                    <tr key={u.id}>
                      <td>{u.email}</td>
                      <td>{u.created_at.slice(0, 10)}</td>
                      <td>{u.apiary_count}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="dash-admin-pagination">
            <button className="dash-admin-btn" disabled={inactivePage <= 1} onClick={() => setInactivePage(p => p - 1)}>←</button>
            <span>{inactivePage} / {inactiveData.pages}</span>
            <button className="dash-admin-btn" disabled={inactivePage >= inactiveData.pages} onClick={() => setInactivePage(p => p + 1)}>→</button>
          </div>
        </>
      )}

      {!drillLoading && section === 'noVarroa' && (
        <div className="dash-admin-table-wrap" style={{ marginTop: '1.5rem' }}>
          <table className="dash-admin-table">
            <thead><tr>
              <th>{t('admin.health.apiary')}</th>
              <th>{t('admin.health.email')}</th>
              <th>{t('admin.health.missing')}</th>
            </tr></thead>
            <tbody>
              {noVarroaData.length === 0
                ? <tr><td colSpan={3} className="dash-empty">{t('admin.health.noData')}</td></tr>
                : noVarroaData.map(a => (
                  <tr key={a.apiary_id}>
                    <td>{a.apiary_name}</td>
                    <td>{a.owner_email}</td>
                    <td>{a.missing_varroa_count}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {!drillLoading && section === 'zeroHives' && (
        <div className="dash-admin-table-wrap" style={{ marginTop: '1.5rem' }}>
          <table className="dash-admin-table">
            <thead><tr>
              <th>{t('admin.health.hive')}</th>
              <th>{t('admin.health.apiary')}</th>
              <th>{t('admin.health.email')}</th>
              <th>{t('admin.health.joined')}</th>
            </tr></thead>
            <tbody>
              {zeroHivesData.length === 0
                ? <tr><td colSpan={4} className="dash-empty">{t('admin.health.noData')}</td></tr>
                : zeroHivesData.map(h => (
                  <tr key={h.id}>
                    <td>{h.name}</td>
                    <td>{h.apiary_name}</td>
                    <td>{h.owner_email}</td>
                    <td>{h.initialized_at.slice(0, 10)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <CrashReportingSelfTest />
    </DashboardShell>
  );
}

/** Crash reporting is the one thing nobody notices is broken until it is needed. */
function CrashReportingSelfTest() {
  const t = useTranslations('dash');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'failed'>('idle');
  const [result, setResult] = useState<CrashReportSelfTest | null>(null);

  const run = () => {
    setState('sending');
    adminSelfTestError()
      .then(data => { setResult(data); setState('done'); })
      .catch(() => setState('failed'));
  };

  return (
    <section className="dash-admin-selftest">
      <h2 className="dash-section-title">{t('admin.health.crashTitle')}</h2>
      <p className="dash-admin-selftest-desc">{t('admin.health.crashDesc')}</p>
      <button className="btn-outline" onClick={run} disabled={state === 'sending'}>
        {state === 'sending' ? t('admin.health.crashSending') : t('admin.health.crashButton')}
      </button>

      {state === 'done' && result && (
        <>
          <p className="dash-admin-selftest-result">
            {result.reporting_enabled && result.event_id
              ? t('admin.health.crashSent', { id: result.event_id, environment: result.environment })
              : t('admin.health.crashOff')}
          </p>
          {!result.reporting_enabled && result.diagnosis && (
            <p className="dash-admin-selftest-result muted">
              {t('admin.health.crashDiagnosis', {
                settingsChars: result.diagnosis.dsn_characters_in_settings,
                envChars: result.diagnosis.dsn_characters_in_process_env,
              })}
            </p>
          )}
        </>
      )}
      {state === 'failed' && (
        <p className="dash-admin-selftest-result error">{t('admin.health.crashFailed')}</p>
      )}
    </section>
  );
}

function HealthCard({ label, desc, count, active, onClick }: {
  label: string; desc: string; count: number; active: boolean; onClick: () => void;
}) {
  return (
    <button
      className={`dash-admin-health-card${active ? ' active' : ''}`}
      onClick={onClick}
    >
      <div className="dash-admin-health-count">{count.toLocaleString()}</div>
      <div className="dash-admin-health-label">{label}</div>
      <div className="dash-admin-health-desc">{desc}</div>
    </button>
  );
}
