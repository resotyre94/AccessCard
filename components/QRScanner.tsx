
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'https://esm.sh/html5-qrcode';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError: (error: string) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onScanError }) => {
  const [useCamera, setUseCamera] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = "qr-reader-region";

  useEffect(() => {
    if (useCamera) {
      scannerRef.current = new Html5Qrcode(regionId);
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      
      scannerRef.current.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          onScanSuccess(decodedText);
          // Optional: Vibrate on success
          if ('vibrate' in navigator) navigator.vibrate(100);
        },
        onScanError
      ).catch((err) => {
        console.error("Failed to start camera", err);
        setUseCamera(false); // Fallback to file upload if camera fails
      });
    }

    return () => {
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(console.error);
        }
      }
    };
  }, [useCamera, onScanSuccess, onScanError]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const html5QrCode = new Html5Qrcode(regionId);
    html5QrCode.scanFile(file, true)
      .then(decodedText => {
        onScanSuccess(decodedText);
      })
      .catch(err => {
        alert("Could not find a valid QR code in this image.");
        console.error(err);
      });
  };

  return (
    <div className="w-full flex flex-col items-center">
      {useCamera ? (
        <div id={regionId} className="w-full rounded-2xl overflow-hidden bg-black aspect-square"></div>
      ) : (
        <div className="p-10 border-2 border-dashed border-zinc-700 rounded-3xl w-full text-center">
          <p className="mb-4 text-zinc-400">Camera not available or disabled.</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            id="qr-file-upload"
          />
          <label
            htmlFor="qr-file-upload"
            className="inline-block py-3 px-6 bg-purple-600 text-white font-bold rounded-xl cursor-pointer hover:bg-purple-500 transition-colors"
          >
            Upload QR Image
          </label>
        </div>
      )}
      
      <div className="mt-4 flex gap-4">
        <button 
          onClick={() => setUseCamera(!useCamera)}
          className="text-xs uppercase tracking-widest font-black text-zinc-500 hover:text-cyan-400 transition-colors"
        >
          {useCamera ? "Switch to File Upload" : "Try Camera Again"}
        </button>
      </div>
    </div>
  );
};
