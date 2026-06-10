import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt';

const KipasControl = () => {
  const [client, setClient] = useState(null);
  const [koneksiAktif, setKoneksiAktif] = useState(false);
  const [modeAktif, setModeAktif] = useState('AUTO'); 

  const topikKendali = 'tsaqif_ub_vm17/kendali_kipas';

  useEffect(() => {
    // React WAJIB menggunakan protokol WSS (WebSocket Secure) dan port 8084
    const urlBroker = 'wss://broker.emqx.io:8084/mqtt';
    const mqttClient = mqtt.connect(urlBroker, {
      clientId: 'ReactDashboard_' + Math.random().toString(16).substring(2, 8),
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    });

    mqttClient.on('connect', () => {
      console.log('✅ React terhubung ke EMQX Broker (WSS)!');
      setKoneksiAktif(true);
    });

    mqttClient.on('disconnect', () => {
      setKoneksiAktif(false);
    });

    setClient(mqttClient);

    // Cleanup memori saat komponen ditutup/pindah halaman
    return () => {
      if (mqttClient) {
        mqttClient.end();
      }
    };
  }, []);

  const kirimPerintah = (perintah) => {
    if (client && koneksiAktif) {
      client.publish(topikKendali, perintah);
      setModeAktif(perintah);
    } else {
      alert("Menunggu koneksi ke Broker MQTT...");
    }
  };

  return (
    <div className="p-6 max-w-sm bg-white rounded-xl shadow-md space-y-4 border border-gray-100">
      <div className="flex justify-between items-center border-b pb-2">
        <h2 className="text-xl font-bold text-gray-800">Kendali Ventilasi</h2>
        <span className={`flex h-3 w-3 rounded-full ${koneksiAktif ? 'bg-green-500' : 'bg-red-500'}`}></span>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-gray-500 font-medium">Pilih Mode Operasional:</p>
        
        {/* Tombol AUTO */}
        <button
          onClick={() => kirimPerintah('AUTO')}
          className={`w-full py-2 px-4 rounded-lg font-semibold transition-all duration-200 ${
            modeAktif === 'AUTO' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-gray-100 text-gray-600 hover:bg-blue-100'
          }`}
        >
          🤖 Mode Otomatis (Sensor)
        </button>

        <div className="flex space-x-2">
          {/* Tombol MANUAL ON */}
          <button
            onClick={() => kirimPerintah('MANUAL_ON')}
            className={`w-1/2 py-2 px-4 rounded-lg font-semibold transition-all duration-200 ${
              modeAktif === 'MANUAL_ON' 
                ? 'bg-green-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-green-100'
            }`}
          >
            Nyala Paksa
          </button>

          {/* Tombol MANUAL OFF */}
          <button
            onClick={() => kirimPerintah('MANUAL_OFF')}
            className={`w-1/2 py-2 px-4 rounded-lg font-semibold transition-all duration-200 ${
              modeAktif === 'MANUAL_OFF' 
                ? 'bg-red-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-red-100'
            }`}
          >
            Mati Paksa
          </button>
        </div>
      </div>
    </div>
  );
};

export default KipasControl;