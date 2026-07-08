'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import DashboardShell from '@/components/DashboardShell';
import { useDashboardReady } from '@/hooks/useDashboardAuth';
import { getQrBatch, downloadQrBatchPdf, type QrBatchOut } from '@/lib/api';

export default function QrBatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations('dash');
  const ready = useDashboardReady();
  const [batch, setBatch] = useState<QrBatchOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [dlError, setDlError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    getQrBatch(id)
      .then(setBatch)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ready, id]);

  async function handleDownload() {
    setDownloading(true);
    setDlError(null);
    try {
      const blob = await downloadQrBatchPdf(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-batch-${id.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setDlError(t('qrBatches.errorGeneric'));
    } finally {
      setDownloading(false);
    }
  }

  const linkedCount = batch?.tokens.filter(tk => tk.linked_hive_id).length ?? 0;

  return (
    <DashboardShell>
      <div className="dash-page-header">
        <h1 className="dash-page-title">{t('qrBatches.detailTitle')}</h1>
        <Link href="/dashboard/qr-batches" className="dash-cancel-btn">{t('qrBatches.backToList')}</Link>
      </div>

      {loading && <div className="spinner" />}

      {!loading && batch && (
        <>
          <div className="dash-profile-card" style={{ marginBottom: 24 }}>
            <div className="dash-stat-row">
              <div className="dash-stat-pill">
                <div className="dash-stat-pill-header">
                  <span className="lbl">{t('qrBatches.total')}</span>
                  <div className="dash-stat-icon dash-stat-icon-amber">
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                  </div>
                </div>
                <div className="num">{batch.count}</div>
              </div>
              <div className="dash-stat-pill">
                <div className="dash-stat-pill-header">
                  <span className="lbl">{t('qrBatches.linked')}</span>
                  <div className="dash-stat-icon dash-stat-icon-green">
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  </div>
                </div>
                <div className="num">{linkedCount}</div>
              </div>
              <div className="dash-stat-pill">
                <div className="dash-stat-pill-header">
                  <span className="lbl">{t('qrBatches.date')}</span>
                  <div className="dash-stat-icon dash-stat-icon-blue">
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                </div>
                <div className="num" style={{ fontSize: '1.25rem' }}>{new Date(batch.created_at).toLocaleDateString()}</div>
              </div>
            </div>
            {dlError && <div className="dash-error-banner" style={{ marginTop: 12 }}>{dlError}</div>}
            <div style={{ marginTop: 16 }}>
              <button className="dash-submit-btn" onClick={handleDownload} disabled={downloading}>
                {downloading ? '…' : t('qrBatches.downloadPdf')}
              </button>
            </div>
          </div>

          <div className="dash-profile-card">
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>{t('qrBatches.tokens')}</h2>
            <div className="dash-token-grid">
              {batch.tokens.map(tk => (
                <div key={tk.token} className={`dash-token-chip ${tk.linked_hive_id ? 'dash-token-linked' : 'dash-token-unlinked'}`}>
                  <span className="dash-token-uuid">{tk.token.slice(0, 8)}…</span>
                  <span className="dash-token-status">
                    {tk.linked_hive_id ? t('qrBatches.linkedBadge') : t('qrBatches.unlinkedBadge')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  );
}
