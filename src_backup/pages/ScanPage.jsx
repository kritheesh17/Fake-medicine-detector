import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Loader2, ScanSearch, UploadCloud } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { addHistoryEntry, fetchMedicineByBarcode } from "../services/firestoreService";

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

  useEffect(() => {
    const attemptImageDecode = async () => {
      if (!previewUrl || !imageRef.current || !readerRef.current) {
        return;
      }

      try {
        readerRef.current.reset();
        const barcodeResult = await readerRef.current.decodeFromImageElement(imageRef.current);
        if (barcodeResult?.getText()) {
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

    attemptImageDecode();
  }, [previewUrl]);

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
      try {
        if (!readerRef.current) {
          readerRef.current = new BrowserMultiFormatReader();
        }

        readerRef.current.reset();
        const barcodeResult = await readerRef.current.decodeFromImageElement(imageElement);
        if (barcodeResult?.getText()) {
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
      const scanOutcome = medicine ? "Verified Original" : "Possible Fake Medicine";
      setResultType(medicine ? "success" : "danger");
      setResult({ barcode, medicine, scanOutcome });

      await addHistoryEntry({
        uid: user?.uid,
        medicineName: medicine?.medicineName || "Unknown",
        barcode,
        result: scanOutcome,
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
      </div>

      {isScanning ? (
        <div className="loading-card">
          <Loader2 size={20} className="spin" />
          <span>Scanning barcode…</span>
        </div>
      ) : null}

      {result ? (
        <div className={`result-card ${resultType}`}>
          <div className="result-title-row">
            <strong>{statusLabel}</strong>
            <span className="pill-badge">{result.barcode}</span>
          </div>

          {result.medicine ? (
            <div className="detail-grid">
              <div>
                <span>Medicine</span>
                <strong>{result.medicine.medicineName}</strong>
              </div>
              <div>
                <span>Manufacturer</span>
                <strong>{result.medicine.manufacturer}</strong>
              </div>
              <div>
                <span>Batch</span>
                <strong>{result.medicine.batchNumber}</strong>
              </div>
              <div>
                <span>Expiry</span>
                <strong>{result.medicine.expiryDate}</strong>
              </div>
              <div>
                <span>Manufactured</span>
                <strong>{result.medicine.manufactureDate}</strong>
              </div>
              <div>
                <span>License</span>
                <strong>{result.medicine.licenseNumber}</strong>
              </div>
            </div>
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
