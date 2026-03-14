import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsQR from "jsqr";
import { supabase } from "../lib/supabaseClient";
import AppLayout from "../components/AppLayout";
import Button from "../components/Button";
import Card from "../components/Card";
import Input from "../components/Input";
import { colors, spacing, typography } from "../constants/designTokens";

function isInfraredLikeCamera(label) {
  const normalized = (label || "").toLowerCase();
  return normalized.includes("ir")
    || normalized.includes("infrared")
    || normalized.includes("depth");
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

  const scanTimerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const detectorRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const startingCameraRef = useRef(false);

  const navigate = useNavigate();

  // Attach stream to video AFTER React renders the <video> element.
  // Calling load() reinitializes the element after srcObject is set —
  // without it the video stays dark because readyState never advances.
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

    setScanResult(null);
    setScanType("");
    setMaintenanceLogs([]);
    setStockTransactions([]);
    setScanAttempted(false);

    if (!trimmed) return;
    if (!trimmed.startsWith("M-") && !trimmed.startsWith("P-")) return;

    setScanAttempted(true);

    if (trimmed.startsWith("M-")) {
      const machineCode = trimmed.replace("M-", "");

      const { data, error } = await supabase
        .from("machines")
        .select("*")
        .eq("machine_code", machineCode)
        .single();

      if (error) {
        setScanType("machine");
        return;
      }

      setScanType("machine");
      setScanResult(data);

      const { data: logs, error: logsError } = await supabase
        .from("maintenance_logs")
        .select("*")
        .eq("machine_id", data.id)
        .order("created_at", { ascending: false });

      if (!logsError) {
        setMaintenanceLogs(logs || []);
      }

      const { data: trans, error: transError } = await supabase
        .from("stock_transactions")
        .select("*")
        .eq("machine_id", data.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!transError) {
        setStockTransactions(trans || []);
      }
    }

    if (trimmed.startsWith("P-")) {
      const partCode = trimmed.replace("P-", "");

      const { data, error } = await supabase
        .from("parts")
        .select("*")
        .eq("part_code", partCode)
        .single();

      if (error) {
        setScanType("part");
        return;
      }

      setScanType("part");
      setScanResult(data);

      const { data: trans, error: transError } = await supabase
        .from("stock_transactions")
        .select("*")
        .eq("part_id", data.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!transError) {
        setStockTransactions(trans || []);
      }
    }
  }

  async function runScanNow() {
    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    await processScanValue(scanCode);
  }

  function handleInputChange(e) {
    const value = e.target.value;
    setScanCode(value);

    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    scanTimerRef.current = setTimeout(() => {
      processScanValue(value);
    }, 120);
  }

  async function getCameraStream(cameraId) {
    const attempts = [
      {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      }
    ];

    if (cameraId) {
      attempts.unshift({
        video: {
          deviceId: { exact: cameraId },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
    }
    attempts.push({ video: true, audio: false });

    let lastError = null;
    for (const constraints of attempts) {
      try {
        return await navigator.mediaDevices.getUserMedia(constraints);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  }

  function stopCameraScan() {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraScanning(false);
  }

  async function startCameraScan() {
    if (startingCameraRef.current) return;
    startingCameraRef.current = true;

    setCameraError("");

    try {
      stopCameraScan();

      detectorRef.current = "BarcodeDetector" in window
        ? new window.BarcodeDetector({ formats: ["qr_code"] })
        : null;

      const stream = await getCameraStream(selectedCameraId);
      mediaStreamRef.current = stream;
      await loadCameraDevices();

      const track = stream.getVideoTracks()[0];
      const trackSettings = track?.getSettings?.() || {};
      const activeDeviceId = trackSettings.deviceId;
      if (activeDeviceId) {
        setSelectedCameraId(activeDeviceId);
      }

      setIsCameraScanning(true); // triggers re-render → <video> appears → useEffect fires

      scanIntervalRef.current = setInterval(async () => {
        try {
          if (!videoRef.current || !canvasRef.current) return;

          const video = videoRef.current;
          if (video.paused) {
            video.play().catch(() => {});
          }

          const ready = video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0;
          if (!ready) return;

          const canvas = canvasRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          let raw = "";
          if (detectorRef.current) {
            try {
              const found = await detectorRef.current.detect(canvas);
              raw = found?.[0]?.rawValue?.trim() || "";
            } catch {
              // no-op
            }
          }

          if (!raw) {
            const decoded = jsQR(imageData.data, imageData.width, imageData.height);
            raw = decoded?.data?.trim() || "";
          }

          if (!raw) return;

          setScanCode(raw);
          await processScanValue(raw);
          stopCameraScan();
        } catch (intervalError) {
          console.error(intervalError);
        }
      }, 250);
    } catch (error) {
      console.error(error);
      setCameraError("Could not start camera. Check permission and try again.");
      stopCameraScan();
    } finally {
      startingCameraRef.current = false;
    }
  }

  useEffect(() => {
    loadCameraDevices();

    const hasDeviceEvents = !!navigator.mediaDevices?.addEventListener;
    if (hasDeviceEvents) {
      navigator.mediaDevices.addEventListener("devicechange", loadCameraDevices);
    }

    return () => {
      if (scanTimerRef.current) {
        clearTimeout(scanTimerRef.current);
      }
      if (hasDeviceEvents) {
        navigator.mediaDevices.removeEventListener("devicechange", loadCameraDevices);
      }
      stopCameraScan();
    };
  }, [loadCameraDevices]);

  return (
    <AppLayout>
      <h2 style={{ ...typography.sectionTitle, margin: `0 0 ${spacing.sm} 0`, color: colors.darkText }}>Scan QR Code</h2>
      <p style={{ margin: `0 0 ${spacing.xl} 0`, ...typography.body, color: colors.lightText }}>Scan machine or part QR code using the scanner.</p>

      <div style={{ display: "flex", gap: spacing.sm, marginBottom: spacing.lg, flexWrap: "wrap" }}>
        {!isCameraScanning ? (
          <Button variant="primary" onClick={startCameraScan}>SCAN</Button>
        ) : (
          <Button variant="danger" onClick={stopCameraScan}>Stop Camera</Button>
        )}
      </div>

      {isCameraScanning && (
        <Card style={{ marginBottom: spacing.lg, maxWidth: "520px" }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={(e) => {
              e.target.play().catch(() => {});
            }}
            style={{ width: "100%", borderRadius: "8px", backgroundColor: "#000" }}
          />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <p style={{ margin: `${spacing.md} 0 0 0`, ...typography.small, color: colors.lightText }}>
            Point your camera at the QR code. Scan will stop automatically after detection.
          </p>
        </Card>
      )}

      {!isCameraScanning && <canvas ref={canvasRef} style={{ display: "none" }} />}

      {cameraError && (
        <p style={{ color: colors.danger, marginBottom: spacing.md, ...typography.body }}>
          {cameraError}
        </p>
      )}

      <Input
        type="text"
        autoFocus
        value={scanCode}
        onChange={handleInputChange}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            runScanNow();
          }
        }}
        placeholder="Scan code here..."
        style={{ width: "400px" }}
      />

      <div style={{ marginTop: spacing.xl }}>
        {scanType === "machine" && scanResult && (
          <Card>
            <h3 style={{ ...typography.cardTitle, margin: `0 0 ${spacing.lg} 0`, color: colors.darkText }}>Machine Found</h3>
            <p style={{ margin: spacing.sm, ...typography.body, color: colors.lightText }}><strong>Code:</strong> {scanResult.machine_code}</p>
            <p style={{ margin: spacing.sm, ...typography.body, color: colors.lightText }}><strong>Name:</strong> {scanResult.machine_name}</p>
            <p style={{ margin: spacing.sm, ...typography.body, color: colors.lightText }}><strong>Status:</strong> {scanResult.status}</p>

            <Button
              variant="primary"
              onClick={() => navigate(`/factory/${scanResult.factory_id}`)}
              style={{ marginTop: spacing.lg }}
            >
              Open Factory Page
            </Button>

            {maintenanceLogs.length > 0 && (
              <div style={{ marginTop: spacing.xl }}>
                <h3 style={{ ...typography.cardTitle, margin: `0 0 ${spacing.md} 0`, color: colors.darkText }}>Maintenance Logs</h3>
                <ul style={{ listStyleType: "none", padding: 0 }}>
                  {maintenanceLogs.map((log) => (
                    <li key={log.id} style={{ padding: spacing.md, borderBottom: `1px solid ${colors.borderLight}`, ...typography.body, color: colors.lightText }}>
                      {(log.issue_title || log.description || "Maintenance log")} - {new Date(log.created_at).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {stockTransactions.length > 0 && (
              <div style={{ marginTop: spacing.xl }}>
                <h3 style={{ ...typography.cardTitle, margin: `0 0 ${spacing.md} 0`, color: colors.darkText }}>Recent Stock Transactions</h3>
                <ul style={{ listStyleType: "none", padding: 0 }}>
                  {stockTransactions.map((trans) => (
                    <li key={trans.id} style={{ padding: spacing.md, borderBottom: `1px solid ${colors.borderLight}`, ...typography.body, color: colors.lightText }}>
                      {(trans.transaction_type || trans.type)} {(trans.qty ?? trans.quantity)} - {new Date(trans.created_at).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}

        {scanType === "part" && scanResult && (
          <Card>
            <h3 style={{ ...typography.cardTitle, margin: `0 0 ${spacing.lg} 0`, color: colors.darkText }}>Part Found</h3>
            <p style={{ margin: spacing.sm, ...typography.body, color: colors.lightText }}><strong>Code:</strong> {scanResult.part_code}</p>
            <p style={{ margin: spacing.sm, ...typography.body, color: colors.lightText }}><strong>Name:</strong> {scanResult.part_name}</p>
            <p style={{ margin: spacing.sm, ...typography.body, color: colors.lightText }}><strong>Stock:</strong> {scanResult.current_stock}</p>
            <p style={{ margin: spacing.sm, ...typography.body, color: colors.lightText }}><strong>Location:</strong> {scanResult.location}</p>

            <Button
              variant="primary"
              onClick={() => navigate(`/factory/${scanResult.factory_id}`)}
              style={{ marginTop: spacing.lg }}
            >
              Open Factory Page
            </Button>

            {stockTransactions.length > 0 && (
              <div style={{ marginTop: spacing.xl }}>
                <h3 style={{ ...typography.cardTitle, margin: `0 0 ${spacing.md} 0`, color: colors.darkText }}>Recent Stock Transactions</h3>
                <ul style={{ listStyleType: "none", padding: 0 }}>
                  {stockTransactions.map((trans) => (
                    <li key={trans.id} style={{ padding: spacing.md, borderBottom: `1px solid ${colors.borderLight}`, ...typography.body, color: colors.lightText }}>
                      {(trans.transaction_type || trans.type)} {(trans.qty ?? trans.quantity)} - {new Date(trans.created_at).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}

        {scanAttempted && !scanResult && (
          <p style={{ color: colors.danger, marginTop: spacing.xl, ...typography.body }}>No matching record found.</p>
        )}
      </div>
    </AppLayout>
  );
}

export default ScanPage;