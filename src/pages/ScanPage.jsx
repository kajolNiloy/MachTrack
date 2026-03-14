import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import jsQR from "jsqr";
import { supabase } from "../lib/supabaseClient";
import AppLayout from "../components/AppLayout";
import Button from "../components/Button";
import Input from "../components/Input";
import { colors, spacing, typography } from "../constants/designTokens";

function isInfraredLikeCamera(label) {
  const normalized = (label || "").toLowerCase();
  return normalized.includes("ir") || normalized.includes("infrared") || normalized.includes("depth");
}

function pickPreferredCamera(devices) {
  if (!devices.length) return "";
  const visibleDevices = devices.filter((device) => !isInfraredLikeCamera(device.label));
  const candidates = visibleDevices.length ? visibleDevices : devices;
  const rearCamera = candidates.find((device) => {
    const label = (device.label || "").toLowerCase();
    return label.includes("back") || label.includes("rear") || label.includes("environment");
  });
  return rearCamera?.deviceId || candidates[0].deviceId || "";
}

function ScanPage() {
  const [scanCode, setScanCode] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [scanType, setScanType] = useState("");
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [stockTransactions, setStockTransactions] = useState([]);
  const [scanAttempted, setScanAttempted] = useState(false);
  const [isCameraScanning, setIsCameraScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [selectedCameraId, setSelectedCameraId] = useState("");

  const { t } = useTranslation();
  const scanTimerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const detectorRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const startingCameraRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isCameraScanning || !videoRef.current || !mediaStreamRef.current) return;
    const video = videoRef.current;
    video.srcObject = mediaStreamRef.current;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("autoplay", "");
    video.load();
    video.play().catch((err) => {
      console.error("Video play failed:", err);
      setCameraError("Camera preview failed to start. Please try again.");
    });
  }, [isCameraScanning]);

  const loadCameraDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videos = devices.filter((device) => device.kind === "videoinput");
    if (!selectedCameraId && videos.some((device) => device.label)) {
      setSelectedCameraId(pickPreferredCamera(videos));
    }
  }, [selectedCameraId]);

  async function processScanValue(value) {
    const trimmed = value.trim();
    setScanResult(null); setScanType(""); setMaintenanceLogs([]);
    setStockTransactions([]); setScanAttempted(false);
    if (!trimmed) return;
    if (!trimmed.startsWith("M-") && !trimmed.startsWith("P-")) return;
    setScanAttempted(true);
    if (trimmed.startsWith("M-")) {
      const machineCode = trimmed.replace("M-", "");
      const { data, error } = await supabase.from("machines").select("*").eq("machine_code", machineCode).single();
      if (error) { setScanType("machine"); return; }
      setScanType("machine"); setScanResult(data);
      const { data: logs, error: logsError } = await supabase.from("maintenance_logs").select("*").eq("machine_id", data.id).order("created_at", { ascending: false });
      if (!logsError) setMaintenanceLogs(logs || []);
      const { data: trans, error: transError } = await supabase.from("stock_transactions").select("*").eq("machine_id", data.id).order("created_at", { ascending: false }).limit(10);
      if (!transError) setStockTransactions(trans || []);
    }
    if (trimmed.startsWith("P-")) {
      const partCode = trimmed.replace("P-", "");
      const { data, error } = await supabase.from("parts").select("*").eq("part_code", partCode).single();
      if (error) { setScanType("part"); return; }
      setScanType("part"); setScanResult(data);
      const { data: trans, error: transError } = await supabase.from("stock_transactions").select("*").eq("part_id", data.id).order("created_at", { ascending: false }).limit(10);
      if (!transError) setStockTransactions(trans || []);
    }
  }

  async function runScanNow() {
    if (scanTimerRef.current) { clearTimeout(scanTimerRef.current); scanTimerRef.current = null; }
    await processScanValue(scanCode);
  }

  function handleInputChange(e) {
    const value = e.target.value;
    setScanCode(value);
    if (scanTimerRef.current) { clearTimeout(scanTimerRef.current); scanTimerRef.current = null; }
    scanTimerRef.current = setTimeout(() => { processScanValue(value); }, 120);
  }

  async function getCameraStream(cameraId) {
    const attempts = [{ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }];
    if (cameraId) { attempts.unshift({ video: { deviceId: { exact: cameraId }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }); }
    attempts.push({ video: true, audio: false });
    let lastError = null;
    for (const constraints of attempts) {
      try { return await navigator.mediaDevices.getUserMedia(constraints); } catch (error) { lastError = error; }
    }
    throw lastError;
  }

  function stopCameraScan() {
    if (scanIntervalRef.current) { clearInterval(scanIntervalRef.current); scanIntervalRef.current = null; }
    if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach((track) => track.stop()); mediaStreamRef.current = null; }
    if (videoRef.current) { videoRef.current.srcObject = null; }
    setIsCameraScanning(false);
  }

  async function startCameraScan() {
    if (startingCameraRef.current) return;
    startingCameraRef.current = true;
    setCameraError("");
    try {
      stopCameraScan();
      detectorRef.current = "BarcodeDetector" in window ? new window.BarcodeDetector({ formats: ["qr_code"] }) : null;
      const stream = await getCameraStream(selectedCameraId);
      mediaStreamRef.current = stream;
      await loadCameraDevices();
      const track = stream.getVideoTracks()[0];
      const trackSettings = track?.getSettings?.() || {};
      const activeDeviceId = trackSettings.deviceId;
      if (activeDeviceId) setSelectedCameraId(activeDeviceId);
      setIsCameraScanning(true);
      scanIntervalRef.current = setInterval(async () => {
        try {
          if (!videoRef.current || !canvasRef.current) return;
          const video = videoRef.current;
          if (video.paused) video.play().catch(() => {});
          const ready = video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0;
          if (!ready) return;
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth; canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) return;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          let raw = "";
          if (detectorRef.current) {
            try { const found = await detectorRef.current.detect(canvas); raw = found?.[0]?.rawValue?.trim() || ""; } catch { }
          }
          if (!raw) { const decoded = jsQR(imageData.data, imageData.width, imageData.height); raw = decoded?.data?.trim() || ""; }
          if (!raw) return;
          setScanCode(raw); await processScanValue(raw); stopCameraScan();
        } catch (intervalError) { console.error(intervalError); }
      }, 250);
    } catch (error) {
      console.error(error);
      setCameraError("Could not start camera. Check permission and try again.");
      stopCameraScan();
    } finally { startingCameraRef.current = false; }
  }

  useEffect(() => {
    loadCameraDevices();
    const hasDeviceEvents = !!navigator.mediaDevices?.addEventListener;
    if (hasDeviceEvents) { navigator.mediaDevices.addEventListener("devicechange", loadCameraDevices); }
    return () => {
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
      if (hasDeviceEvents) { navigator.mediaDevices.removeEventListener("devicechange", loadCameraDevices); }
      stopCameraScan();
    };
  }, [loadCameraDevices]);

  return (
    <AppLayout>
      <div style={{ marginBottom: spacing.lg }}>
        <h2 style={{ ...typography.sectionTitle, margin: 0, color: colors.darkText, fontSize: '1.5rem' }}>
          {t('scan_qr')}
        </h2>
        <p style={{ margin: `${spacing.xs} 0 0 0`, ...typography.body, color: colors.lightText }}>
          {t('scan_description')}
        </p>
      </div>

      <div style={{ marginBottom: spacing.lg }}>
        {!isCameraScanning ? (
          <button onClick={startCameraScan} style={{ width: '100%', maxWidth: '480px', height: '64px', fontSize: '1.2rem', fontWeight: '700', letterSpacing: '0.05em', backgroundColor: colors.primary, color: colors.white, border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            📷 {t('scan_btn')}
          </button>
        ) : (
          <button onClick={stopCameraScan} style={{ width: '100%', maxWidth: '480px', height: '64px', fontSize: '1.2rem', fontWeight: '700', backgroundColor: colors.danger, color: colors.white, border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            ✕ {t('stop_camera')}
          </button>
        )}
      </div>

      {isCameraScanning && (
        <div style={{ marginBottom: spacing.lg, maxWidth: '680px' }}>
          <div style={{ backgroundColor: '#000', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', position: 'relative' }}>
            <video ref={videoRef} autoPlay playsInline muted onLoadedMetadata={(e) => { e.target.play().catch(() => {}); }} style={{ width: '100%', display: 'block', borderRadius: '16px' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '200px', height: '200px', border: '3px solid rgba(255,255,255,0.7)', borderRadius: '12px', pointerEvents: 'none' }} />
          </div>
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <p style={{ margin: `${spacing.sm} 0 0 0`, ...typography.small, color: colors.lightText, textAlign: 'center' }}>
            {t('align_qr')}
          </p>
        </div>
      )}

      {!isCameraScanning && <canvas ref={canvasRef} style={{ display: "none" }} />}

      {cameraError && (
        <div style={{ backgroundColor: '#FEF2F2', border: `1px solid ${colors.danger}`, borderRadius: '8px', padding: spacing.md, marginBottom: spacing.md, color: colors.danger, ...typography.body }}>
          {cameraError}
        </div>
      )}

      <div style={{ maxWidth: '480px', marginBottom: spacing.xl }}>
        <Input type="text" autoFocus value={scanCode} onChange={handleInputChange} onKeyDown={(e) => { if (e.key === "Enter") runScanNow(); }} placeholder={t('type_scan_code')} style={{ width: '100%', height: '52px', fontSize: '1rem' }} />
      </div>

      <div>
        {scanType === "machine" && scanResult && (
          <div style={{ backgroundColor: colors.white, borderRadius: '16px', padding: spacing.xl, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', maxWidth: '680px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg, paddingBottom: spacing.lg, borderBottom: `1px solid ${colors.border}` }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#EFF6FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🏭</div>
              <div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: colors.lightText }}>{t('machine_found')}</p>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: colors.darkText }}>{scanResult.machine_name}</h3>
              </div>
              <div style={{ marginLeft: 'auto', backgroundColor: scanResult.status === 'active' ? '#D1FAE5' : '#FEE2E2', color: scanResult.status === 'active' ? '#065F46' : '#991B1B', padding: `${spacing.xs} ${spacing.md}`, borderRadius: '999px', fontSize: '0.8rem', fontWeight: '600' }}>
                {scanResult.status}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md, marginBottom: spacing.lg }}>
              <div style={{ backgroundColor: colors.background, borderRadius: '8px', padding: spacing.md }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: colors.lightText }}>{t('code')}</p>
                <p style={{ margin: `4px 0 0 0`, fontSize: '1rem', fontWeight: '600', color: colors.darkText }}>{scanResult.machine_code}</p>
              </div>
              <div style={{ backgroundColor: colors.background, borderRadius: '8px', padding: spacing.md }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: colors.lightText }}>{t('status')}</p>
                <p style={{ margin: `4px 0 0 0`, fontSize: '1rem', fontWeight: '600', color: colors.darkText }}>{scanResult.status}</p>
              </div>
            </div>
            <button onClick={() => navigate(`/factory/${scanResult.factory_id}`)} style={{ width: '100%', height: '56px', backgroundColor: colors.primary, color: colors.white, border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', marginBottom: spacing.lg }}>
              {t('open_factory')}
            </button>
            {maintenanceLogs.length > 0 && (
              <div style={{ marginTop: spacing.lg }}>
                <h4 style={{ margin: `0 0 ${spacing.md} 0`, fontSize: '1rem', fontWeight: '600', color: colors.darkText }}>{t('maintenance_logs')}</h4>
                {maintenanceLogs.map((log) => (
                  <div key={log.id} style={{ padding: spacing.md, borderBottom: `1px solid ${colors.border}`, fontSize: '0.9rem', color: colors.mediumText }}>
                    {log.issue_title || log.description || "Maintenance log"} — <span style={{ color: colors.lightText }}>{new Date(log.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
            {stockTransactions.length > 0 && (
              <div style={{ marginTop: spacing.lg }}>
                <h4 style={{ margin: `0 0 ${spacing.md} 0`, fontSize: '1rem', fontWeight: '600', color: colors.darkText }}>{t('recent_stock_transactions')}</h4>
                {stockTransactions.map((trans) => (
                  <div key={trans.id} style={{ padding: spacing.md, borderBottom: `1px solid ${colors.border}`, fontSize: '0.9rem', color: colors.mediumText, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{trans.transaction_type} — {trans.qty}</span>
                    <span style={{ color: colors.lightText }}>{new Date(trans.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {scanType === "part" && scanResult && (
          <div style={{ backgroundColor: colors.white, borderRadius: '16px', padding: spacing.xl, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', maxWidth: '680px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg, paddingBottom: spacing.lg, borderBottom: `1px solid ${colors.border}` }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#F0FDF4', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🔩</div>
              <div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: colors.lightText }}>{t('part_found')}</p>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: colors.darkText }}>{scanResult.part_name}</h3>
              </div>
              <div style={{ marginLeft: 'auto', backgroundColor: scanResult.current_stock > scanResult.min_stock ? '#D1FAE5' : '#FEF3C7', color: scanResult.current_stock > scanResult.min_stock ? '#065F46' : '#92400E', padding: `${spacing.xs} ${spacing.md}`, borderRadius: '999px', fontSize: '0.8rem', fontWeight: '600' }}>
                {t('stock')}: {scanResult.current_stock}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md, marginBottom: spacing.lg }}>
              <div style={{ backgroundColor: colors.background, borderRadius: '8px', padding: spacing.md }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: colors.lightText }}>{t('code')}</p>
                <p style={{ margin: `4px 0 0 0`, fontSize: '1rem', fontWeight: '600', color: colors.darkText }}>{scanResult.part_code}</p>
              </div>
              <div style={{ backgroundColor: colors.background, borderRadius: '8px', padding: spacing.md }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: colors.lightText }}>{t('location')}</p>
                <p style={{ margin: `4px 0 0 0`, fontSize: '1rem', fontWeight: '600', color: colors.darkText }}>{scanResult.location}</p>
              </div>
              <div style={{ backgroundColor: colors.background, borderRadius: '8px', padding: spacing.md }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: colors.lightText }}>{t('current_stock')}</p>
                <p style={{ margin: `4px 0 0 0`, fontSize: '1rem', fontWeight: '600', color: colors.darkText }}>{scanResult.current_stock}</p>
              </div>
              <div style={{ backgroundColor: colors.background, borderRadius: '8px', padding: spacing.md }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: colors.lightText }}>{t('category')}</p>
                <p style={{ margin: `4px 0 0 0`, fontSize: '1rem', fontWeight: '600', color: colors.darkText }}>{scanResult.category || '—'}</p>
              </div>
            </div>
            <button onClick={() => navigate(`/factory/${scanResult.factory_id}`)} style={{ width: '100%', height: '56px', backgroundColor: colors.primary, color: colors.white, border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', marginBottom: spacing.lg }}>
              {t('open_factory')}
            </button>
            {stockTransactions.length > 0 && (
              <div style={{ marginTop: spacing.lg }}>
                <h4 style={{ margin: `0 0 ${spacing.md} 0`, fontSize: '1rem', fontWeight: '600', color: colors.darkText }}>{t('recent_stock_transactions')}</h4>
                {stockTransactions.map((trans) => (
                  <div key={trans.id} style={{ padding: spacing.md, borderBottom: `1px solid ${colors.border}`, fontSize: '0.9rem', color: colors.mediumText, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{trans.transaction_type} — {trans.qty}</span>
                    <span style={{ color: colors.lightText }}>{new Date(trans.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {scanAttempted && !scanResult && (
          <div style={{ backgroundColor: '#FEF2F2', border: `1px solid ${colors.danger}`, borderRadius: '12px', padding: spacing.xl, maxWidth: '480px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '1.1rem', color: colors.danger, fontWeight: '600' }}>{t('no_record_found')}</p>
            <p style={{ margin: `${spacing.sm} 0 0 0`, fontSize: '0.9rem', color: colors.lightText }}>{t('check_qr')}</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default ScanPage;