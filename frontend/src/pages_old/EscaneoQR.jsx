import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import useAuth from "../hooks/useAuth";
import axios from "../api/axios";

const EscaneoQR = () => {
  const { auth } = useAuth();
  const qrRef = useRef(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const html5QrCodeRef = useRef(null);
  const scannerStartedRef = useRef(false);
  const isProcessingRef = useRef(false);

  const isMobile = /Mobi|Android/i.test(navigator.userAgent);

  const onScanSuccess = async (decodedText) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      if (qrRef.current) {
        qrRef.current.classList.add("qr-detectado");
      }

      setMensaje("QR detectado, registrando...");
      await new Promise((res) => setTimeout(res, 500));

      if (scannerStartedRef.current && html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
        scannerStartedRef.current = false;
      }

      await registrarAsistencia(decodedText);
    } catch (err) {
      console.error("Error al detener escaneo:", err);
    } finally {
      isProcessingRef.current = false;

      setTimeout(() => {
        if (qrRef.current) {
          qrRef.current.classList.remove("qr-detectado");
        }
      }, 1000);
    }
  };

  const onScanError = (scanError) => {
    console.warn("Escaneo fallido:", scanError);
  };

  const iniciarEscaneo = async () => {
    if (scannerStartedRef.current) return;
    if (!qrRef.current) return;

    if (html5QrCodeRef.current) {
      try {
        if (scannerStartedRef.current) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch {}
      html5QrCodeRef.current = null;
    }

    qrRef.current.innerHTML = "";

    const html5QrCode = new Html5Qrcode(qrRef.current.id);
    html5QrCodeRef.current = html5QrCode;

    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setError("No se detectaron cámaras.");
        return;
      }

      const selectedCam = isMobile
        ? devices.find((d) => d.label.toLowerCase().includes("back")) || devices[0]
        : devices[0];

      requestAnimationFrame(async () => {
        await html5QrCode.start(
          selectedCam.id,
          {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            rememberLastUsedCamera: true,
          },
          onScanSuccess,
          onScanError
        );
        scannerStartedRef.current = true;
      });
    } catch (err) {
      console.error("Error al iniciar escaneo:", err);
      setError("No se pudo acceder a la cámara.");
    }
  };

  useEffect(() => {
    let cancelado = false;
    setTimeout(() => {
      if (!cancelado) {
        iniciarEscaneo();
      }
    }, 300);

    return () => {
      cancelado = true;
      if (html5QrCodeRef.current) {
        if (scannerStartedRef.current) {
          html5QrCodeRef.current
            .stop()
            .then(() => {
              html5QrCodeRef.current.clear();
              scannerStartedRef.current = false;
            })
            .catch((err) => console.warn("Error al cerrar QR:", err));
        } else {
          html5QrCodeRef.current.clear();
        }
      }
    };
  }, []);

  const registrarAsistencia = async (token) => {
    try {
      const res = await axios.post(
        "/asistencia/escaneo",
        { token },
        {
          headers: {
            Authorization: `Bearer ${auth?.accessToken}`,
          },
        }
      );
      setMensaje(res.data.mensaje || "Asistencia registrada correctamente.");
    } catch (err) {
      const msg = err?.response?.data?.error || "Error al registrar asistencia.";
      console.error("Error en asistencia:", msg);
      setError(msg);
    }
  };

  const reintentarEscaneo = () => {
    setMensaje("");
    setError("");
    if (!scannerStartedRef.current) {
      iniciarEscaneo();
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-center">Escaneo de Asistencia</h1>
      <div
        id="lector-qr"
        ref={qrRef}
        className="w-full max-w-md h-[400px] mx-auto mb-6 border-4 border-transparent rounded-lg shadow-md bg-black transition-colors duration-300 flex items-center justify-center overflow-hidden"
        style={{ minHeight: "400px" }}
      ></div>

      {mensaje && <p className="text-green-600 text-center">{mensaje}</p>}
      {error && <p className="text-red-600 text-center">{error}</p>}

      <div className="text-center mt-4">
        <button
          onClick={reintentarEscaneo}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Reintentar escaneo
        </button>
      </div>

      <style>{`
        #lector-qr video {
          object-fit: cover;
          width: 100%;
          height: 100%;
        }
        /* Color de las líneas del QR por defecto */
        #lector-qr canvas {
          stroke: white !important;
        }
        /* Color verde cuando detecta QR */
        #lector-qr.qr-detectado canvas {
          stroke: limegreen !important;
        }
      `}</style>
    </div>
  );
};

export default EscaneoQR;
