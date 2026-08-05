import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Loader2, ScanSearch, UploadCloud, ShieldCheck, ShieldAlert, Building2, Tag, Calendar, Barcode } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { addHistoryEntry, fetchMedicineByBarcode } from "../services/firestoreService";
import { computeVerification, statusToResult } from "../utils/verification";

export default function ScanPage({ user }) {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const imageRef = useRef(null);
  const readerRef = useRef(null);
  const scanHandledRef = useRef(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [resultType, setResultType] = useState("pending");
  const [stream, setStream] = useState(null);

  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader();

    return () => {
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, []);

  useEffect(() => {
    if (!isCameraActive || !stream || !videoRef.current) {
      return;
    }

    let cancelled = false;

    const initializeCameraScanner = async () => {
      const videoElement = videoRef.current;
      if (!videoElement) {
        return;
      }

      try {
        videoElement.srcObject = stream;

        await new Promise((resolve, reject) => {
          const handleLoaded = () => {
            videoElement.removeEventListener("loadedmetadata", handleLoaded);
            videoElement.removeEventListener("error", handleError);
            resolve();
          };

          const handleError = (event) => {
            videoElement.removeEventListener("loadedmetadata", handleLoaded);
            videoElement.removeEventListener("error", handleError);
            reject(new Error("Unable to initialize video stream."));
          };

          videoElement.addEventListener("loadedmetadata", handleLoaded);
          videoElement.addEventListener("error", handleError);
        });

        await videoElement.play();

        if (cancelled || !readerRef.current) {
          return;
        }

        readerRef.current.reset();
        scanHandledRef.current = false;

        const continuousScan = readerRef.current.decodeFromVideoDevice(null, videoElement, async (result) => {
          if (!result || scanHandledRef.current) {
            return;
          }

          scanHandledRef.current = true;
          const text = result.getText?.();
          if (!text) {
            return;
          }

          try {
            await completeScan(text);
          } finally {
            stopCamera();
          }
        });

        await continuousScan.catch((scanError) => {
          if (!scanHandledRef.current) {
            throw scanError;
          }
        });
      } catch (cameraError) {
        if (!cancelled) {
          console.error(cameraError);
          stopCamera();
          setError("Unable to access the camera. Please allow camera permission and try again.");
          setResultType("error");
        }
      } finally {
        if (!cancelled) {
          setIsScanning(false);
        }
      }
    };

    initializeCameraScanner();

    return () => {
      cancelled = true;
    };
  }, [isCameraActive, stream]);

  // NOTE: image decoding for uploads is handled once, inside handleFileSelection's
  // imageElement.onload callback below. A previous version also re-ran the decode
  // here on every previewUrl change, which caused the same barcode to be scanned
  // (and logged to history) twice for a single upload. Do not re-add that effect.

  const resetState = () => {
    setResult(null);
    setResultType("pending");
    setError("");
  };

  const stopCamera = () => {
    const videoElement = videoRef.current;

    if (videoElement) {
      if (videoElement.srcObject) {
        const activeStream = videoElement.srcObject;
        if (activeStream instanceof MediaStream) {
          activeStream.getTracks().forEach((track) => track.stop());
        }
      }

      videoElement.pause();
      videoElement.srcObject = null;
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    if (readerRef.current) {
      readerRef.current.reset();
    }

    setStream(null);
    setIsCameraActive(false);
    setIsScanning(false);
  };

  const handleFileSelection = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    resetState();
    setPreviewUrl("");
    setIsScanning(true);
    scanHandledRef.current = false;

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    const imageElement = imageRef.current;
    if (!imageElement) {
      setError("The selected image could not be prepared for scanning.");
      setResultType("error");
      setIsScanning(false);
      return;
    }

    imageElement.onload = async () => {
      if (scanHandledRef.current) {
        return;
      }

      try {
        if (!readerRef.current) {
          readerRef.current = new BrowserMultiFormatReader();
        }

        readerRef.current.reset();
        const barcodeResult = await readerRef.current.decodeFromImageElement(imageElement);
        if (barcodeResult?.getText()) {
          scanHandledRef.current = true;
          await completeScan(barcodeResult.getText());
        } else {
          throw new Error("No barcode detected");
        }
      } catch (scanError) {
        console.error(scanError);
        setError("No barcode could be read from the selected image. Please try another image.");
        setResultType("error");
      } finally {
        setIsScanning(false);
      }
    };

    imageElement.onerror = () => {
      setError("The selected file is not a valid image. Please choose a JPG, PNG, or JPEG file.");
      setResultType("error");
      setIsScanning(false);
    };

    imageElement.src = objectUrl;
  };

  const openCamera = async () => {
    resetState();
    setIsScanning(true);
    setError("");
    scanHandledRef.current = false;

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access is not supported in this browser.");
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === "videoinput");
      if (!videoDevices.length) {
        throw new Error("No camera is available on this device.");
      }

      if (stream) {
        stopCamera();
      }

      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      setStream(cameraStream);
      setIsCameraActive(true);
    } catch (scanError) {
      console.error(scanError);
      stopCamera();
      setError(
        scanError?.message === "No camera is available on this device."
          ? "No camera is available on this device."
          : "Unable to access the camera. Please allow camera permission and try again."
      );
      setResultType("error");
      setIsScanning(false);
    }
  };

  const completeScan = async (barcode) => {
    try {
      const medicine = await fetchMedicineByBarcode(barcode);
      const verification = computeVerification(medicine, barcode);
      const scanOutcome = statusToResult(verification.status);

      const resultTypeMap = { Verified: "success", "Needs Review": "warning", Fake: "danger" };
      setResultType(resultTypeMap[verification.status] || "danger");
      setResult({ barcode, medicine, scanOutcome, verification });

      await addHistoryEntry({
        uid: user?.uid,
        medicineName: medicine?.medicineName || "Unknown",
        barcode,
        result: scanOutcome,
        trustScore: verification.trustScore,
        packaging: verification.packaging,
      });
    } catch (scanError) {
      console.error(scanError);
      setError("We could not complete the scan right now.");
      setResultType("error");
    }
  };

  const showReport = () => {
    navigate("/report", {
      state: {
        medicineName: result?.medicine?.medicineName || "Unknown medicine",
        barcode: result?.barcode,
      },
    });
  };

  const statusLabel = useMemo(() => {
    if (resultType === "success") return "Verified Original";
    if (resultType === "warning") return "Needs Review";
    if (resultType === "danger") return "Possible Fake Medicine";
    return "Scan pending";
  }, [resultType]);


  return (
    <div className="page-card">
      <div className="page-head">
        <div>
          <p className="eyebrow">Instant medicine check</p>
          <h2>Scan medicine</h2>
        </div>
        <div className="pill-badge">AI assisted</div>
      </div>

      <div className="action-row">
        <label className="upload-card">
          <UploadCloud size={18} />
          <span>Upload image</span>
          <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleFileSelection} />
        </label>

        <button className="secondary-btn" type="button" onClick={openCamera}>
          <Camera size={18} />
          Open camera
        </button>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      <div className="scanner-stage">
        {previewUrl ? <img alt="medicine preview" className="scanner-preview" src={previewUrl} ref={imageRef} /> : null}
        {isCameraActive ? <video className="scanner-preview" ref={videoRef} playsInline muted /> : null}
        {!previewUrl && !isCameraActive ? (
          <div className="empty-state scanner-empty">
            <ScanSearch size={36} />
            <p>Use an image upload or camera scan to inspect the medication.</p>
          </div>
        ) : null}
        <div className="scan-frame">
          <span className="scan-corner tl" />
          <span className="scan-corner tr" />
          <span className="scan-corner bl" />
          <span className="scan-corner br" />
        </div>
      </div>

      {isScanning ? (
        <div className="loading-card">
          <Loader2 size={20} className="spin" />
          <span>Scanning barcode…</span>
        </div>
      ) : null}

      {result ? (
        <div className={`result-card ${resultType}`}>
          <div className="verification-banner">
            <div className={`verification-icon ${resultType}`}>
              {result.verification.status === "Verified" ? <ShieldCheck size={30} /> : <ShieldAlert size={30} />}
            </div>
            <div>
              <span className={`status-chip ${resultType === "success" ? "verified" : resultType === "warning" ? "review" : "fake"}`}>
                {result.verification.status.toUpperCase()}
              </span>
              <h3 className="verification-title">
                {result.verification.status === "Verified" && "Genuine Medicine"}
                {result.verification.status === "Needs Review" && "Needs Manual Review"}
                {result.verification.status === "Fake" && (result.medicine ? "Verification Failed" : "Medicine Not Found")}
              </h3>
              <p className="verification-sub">
                {result.verification.status === "Verified" && "This medicine is authentic and safe to use."}
                {result.verification.status === "Needs Review" && "Some checks did not fully pass. Verify with a pharmacist before use."}
                {result.verification.status === "Fake" && (result.medicine
                  ? "This record failed our authenticity checks."
                  : "This code is not present in the verified database.")}
              </p>
            </div>
          </div>

          <div className="trust-score-row">
            <div>
              <div className={`trust-score-value ${resultType === "success" ? "" : resultType === "warning" ? "warning" : "danger"}`}>
                {result.medicine ? `${result.verification.trustScore}%` : "0%"}
              </div>
              <div className="trust-score-label">Trust Score</div>
            </div>
            <span className="pill-badge">{result.barcode}</span>
          </div>

          {result.medicine ? (
            <>
              <div className="detail-grid">
                <div>
                  <span><Tag size={11} /> Medicine</span>
                  <strong>{result.medicine.medicineName}</strong>
                </div>
                <div>
                  <span><Building2 size={11} /> Manufacturer</span>
                  <strong>{result.medicine.manufacturer}</strong>
                </div>
                <div>
                  <span><Barcode size={11} /> Batch</span>
                  <strong>{result.medicine.batchNumber}</strong>
                </div>
                <div>
                  <span><Calendar size={11} /> Expiry</span>
                  <strong>{result.medicine.expiryDate}</strong>
                </div>
                <div>
                  <span><Calendar size={11} /> Manufactured</span>
                  <strong>{result.medicine.manufactureDate}</strong>
                </div>
                <div>
                  <span><ShieldCheck size={11} /> License</span>
                  <strong>{result.medicine.licenseNumber}</strong>
                </div>
              </div>

              <div className="packaging-analysis">
                <div className="card-top-row">
                  <strong>AI Packaging Analysis</strong>
                  <span className={`pill-badge ${Object.values(result.verification.packaging).every(Boolean) ? "verified-pill" : "review-pill"}`}>
                    {Object.values(result.verification.packaging).every(Boolean) ? "All Matched" : "Review Needed"}
                  </span>
                </div>
                <div className="packaging-grid">
                  <div className={`packaging-item ${result.verification.packaging.logoMatch ? "" : "mismatch"}`}>
                    {result.verification.packaging.logoMatch ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                    <span>Logo Match</span>
                  </div>
                  <div className={`packaging-item ${result.verification.packaging.textMatch ? "" : "mismatch"}`}>
                    {result.verification.packaging.textMatch ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                    <span>Text Match</span>
                  </div>
                  <div className={`packaging-item ${result.verification.packaging.colorMatch ? "" : "mismatch"}`}>
                    {result.verification.packaging.colorMatch ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                    <span>Color Match</span>
                  </div>
                </div>
              </div>

              {result.verification.reasons.length ? (
                <div className="reasons-list">
                  {result.verification.reasons.map((reason) => (
                    <p key={reason}>• {reason}</p>
                  ))}
                </div>
              ) : null}

              {result.verification.status !== "Verified" ? (
                <button className="secondary-btn full-width report-btn" type="button" onClick={showReport}>
                  Report this medicine
                </button>
              ) : null}
            </>
          ) : (
            <div className="empty-state">
              <h3>Medicine not found</h3>
              <p>The scanned code is not present in the verified database. Report this medicine if needed.</p>
              <button className="primary-btn" type="button" onClick={showReport}>
                Report medicine
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
