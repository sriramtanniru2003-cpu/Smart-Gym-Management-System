// src/components/QRScanner.js
import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QRScanner({ onScan }) {
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  useEffect(() => {
    if (!scannerRef.current) return;

    // Initialize scanner
    html5QrcodeScannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: 250,
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true
      },
      false
    );

    // Start scanning
    html5QrcodeScannerRef.current.render(
      (decodedText) => {
        // Success callback
        console.log("QR Code detected:", decodedText);
        onScan(decodedText);
        
        // Stop scanner after successful scan
        if (html5QrcodeScannerRef.current) {
          html5QrcodeScannerRef.current.clear();
        }
      },
      (errorMessage) => {
        // Error callback - ignore most errors
        console.log("QR Code scan error:", errorMessage);
      }
    );

    // Cleanup
    return () => {
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current.clear().catch(error => {
          console.error("Failed to clear scanner:", error);
        });
      }
    };
  }, [onScan]);

  return (
    <div>
      <div id="qr-reader" ref={scannerRef}></div>
      <p className="text-sm text-gray-500 mt-2 text-center">
        Point your camera at a QR code
      </p>
    </div>
  );
}