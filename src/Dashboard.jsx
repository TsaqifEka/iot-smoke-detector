import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';
import mqtt from 'mqtt'; // <-- IMPORT MESIN MQTT

export default function Dashboard({ token, onLogout }) {
  const [kadarAsap, setKadarAsap] = useState(0);
  const [riwayat, setRiwayat] = useState([]);
  const [riwayatDevice, setRiwayatDevice] = useState([]);
  const [jam, setJam] = useState("");
  const [statusAlat, setStatusAlat] = useState("MENUNGGU...");
  
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isAuto, setIsAuto] = useState(true);
  const [manualSpeed, setManualSpeed] = useState('OFF');
  
  const [filterTanggal, setFilterTanggal] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // --- STATE KHUSUS MQTT ---
  const [mqttClient, setMqttClient] = useState(null);
  const [koneksiMqtt, setKoneksiMqtt] = useState(false);
  const topikKendali = 'tsaqif_ub_vm17/kendali_kipas';

  const BASE_URL = "https://smoke-detect.my.id/api";

  // ================= FUNGSI KONEKSI MQTT (WebSockets) =================
  useEffect(() => {
    const urlBroker = 'wss://broker.emqx.io:8084/mqtt';
    const client = mqtt.connect(urlBroker, {
      clientId: 'ReactDashboard_' + Math.random().toString(16).substring(2, 8),
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    });

    client.on('connect', () => {
      console.log('✅ UI Control Center terhubung ke MQTT Broker!');
      setKoneksiMqtt(true);
      setMqttClient(client);
    });

    client.on('disconnect', () => setKoneksiMqtt(false));

    return () => client.end();
  }, []);

  // ================= TRIGGER AKSI KONTROL =================
  const handleToggleMode = () => {
    const modeBaru = !isAuto;
    setIsAuto(modeBaru);
    
    if (mqttClient && koneksiMqtt) {
      if (modeBaru === true) {
        mqttClient.publish(topikKendali, 'AUTO');
      } else {
        // PERUBAHAN: Bedakan perintah berdasarkan posisi slider saat ini
        let perintah = 'MANUAL_OFF';
        if (manualSpeed === 'LOW') perintah = 'MANUAL_LOW';
        if (manualSpeed === 'HIGH') perintah = 'MANUAL_HIGH';
        
        mqttClient.publish(topikKendali, perintah);
      }
    }
  };

  const handleSliderChange = (e) => {
    const indexBaru = e.target.value;
    const speedLevels = ['OFF', 'LOW', 'HIGH'];
    const speedBaru = speedLevels[indexBaru];
    
    setManualSpeed(speedBaru);

    if (!isAuto && mqttClient && koneksiMqtt) {
      // PERUBAHAN: Tembak perintah spesifik ke ESP32
      let perintah = 'MANUAL_OFF';
      if (speedBaru === 'LOW') perintah = 'MANUAL_LOW';
      if (speedBaru === 'HIGH') perintah = 'MANUAL_HIGH';
      
      mqttClient.publish(topikKendali, perintah);
    }
  };


  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const optionsDate = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
      setJam(`${now.toLocaleDateString('id-ID', optionsDate)} | ${now.toLocaleTimeString('id-ID', { hour12: false })} WIB`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const ambilData = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${BASE_URL}/api.php`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = response.data;
      if (data && data.length > 0) {
        setKadarAsap(parseInt(data[0].nilai_asap) || 0);
        
        const dataGrafik = [...data].reverse().map(item => {
          const splitWaktu = item.created_at ? item.created_at.split(' ') : ['', ''];
          return {
            tanggal: splitWaktu[0],
            waktu: splitWaktu[1],
            fullDate: item.created_at,
            asap: parseInt(item.nilai_asap)
          };
        });
        setRiwayat(dataGrafik);

        const serverTime = new Date(data[0].created_at.replace(/-/g, '/')); 
        const now = new Date();
        const diffSeconds = (now - serverTime) / 1000;
        setStatusAlat(diffSeconds > 15 ? "OFFLINE" : "ONLINE");

        const dLogs = [];
        for(let i = 0; i < data.length - 1; i++) {
           const waktuSekarang = new Date(data[i].created_at.replace(/-/g, '/')).getTime();
           const waktuSebelumnya = new Date(data[i+1].created_at.replace(/-/g, '/')).getTime();
           const selisihDetik = (waktuSekarang - waktuSebelumnya) / 1000;
           
           if(selisihDetik > 20) {
              dLogs.push({
                 id: i,
                 tanggal: data[i].created_at.split(' ')[0],
                 waktu_putus: data[i+1].created_at.split(' ')[1], 
                 waktu_nyala: data[i].created_at.split(' ')[1],   
                 durasi: Math.round(selisihDetik)
              });
           }
        }
        setRiwayatDevice(dLogs);
      }
    } catch (error) {
      setStatusAlat("OFFLINE");
      if (error.response?.status === 401) onLogout();
    }
  };

  useEffect(() => {
    if (token) {
      ambilData();
      const interval = setInterval(ambilData, 2000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const formatHariTanggal = (tglString) => {
    if (!tglString) return '';
    const dateObj = new Date(tglString);
    return dateObj.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  let teksStatus = 'NORMAL';
  let warnaAksen = isDarkMode ? '#22c55e' : '#16a34a'; 
  let badgeClass = 'bg-green-500/10 text-green-500 border-green-500/20';
  
  if (kadarAsap >= 300 && kadarAsap <= 600) {
    teksStatus = 'WASPADA';
    warnaAksen = '#eab308'; 
    badgeClass = 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
  } else if (kadarAsap > 600) {
    teksStatus = 'KRITIS';
    warnaAksen = '#ef4444'; 
    badgeClass = 'bg-red-500/10 text-red-500 border-red-500/20';
  }

  let activeSpeed = 'OFF';
  if (isAuto) {
    if (kadarAsap < 300) activeSpeed = 'OFF';
    else if (kadarAsap >= 300 && kadarAsap <= 600) activeSpeed = 'LOW';
    else if (kadarAsap > 600) activeSpeed = 'HIGH';
  } else {
    activeSpeed = manualSpeed;
  }

  let animasiKipas = '';
  let warnaBaling = isDarkMode ? 'text-neutral-800' : 'text-slate-200';
  let shadowBaling = 'drop-shadow-none';
  
  if (activeSpeed === 'LOW') {
    animasiKipas = 'animate-[spin_2s_linear_infinite]';
    warnaBaling = 'text-yellow-500';
    shadowBaling = 'drop-shadow-[0_0_15px_rgba(234,179,8,0.4)]';
  } else if (activeSpeed === 'HIGH') {
    animasiKipas = 'animate-[spin_0.3s_linear_infinite]';
    warnaBaling = 'text-red-500';
    shadowBaling = 'drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]';
  }

  const theme = {
    bg: isDarkMode ? 'bg-[#050505]' : 'bg-[#f8fafc]',
    nav: isDarkMode ? 'bg-[#121212]/70 border-neutral-800/50' : 'bg-white/70 border-slate-200/50',
    bento: isDarkMode ? 'bg-[#121212] border-neutral-800/50 hover:border-neutral-700/50' : 'bg-white border-slate-200/50 hover:border-slate-300/50',
    textMain: isDarkMode ? 'text-white' : 'text-slate-800',
    textMuted: isDarkMode ? 'text-neutral-400' : 'text-slate-500',
    gridLine: isDarkMode ? '#1f2937' : '#e2e8f0',
  };

  const persentase = Math.round((kadarAsap / 1000) * 100);
  const speedLevels = ['OFF', 'LOW', 'HIGH'];
  const currentSpeedIndex = speedLevels.indexOf(manualSpeed);

  const opsiTanggalUnik = [...new Set(riwayat.map(item => item.tanggal))];
  const dataBerdasarkanTanggal = filterTanggal === 'ALL' ? riwayat : riwayat.filter(item => item.tanggal === filterTanggal);
  const dataLogTampil = dataBerdasarkanTanggal.filter(item => {
    if (filterStatus === 'ALL') return true;
    let s = 'NORMAL';
    if (item.asap >= 300 && item.asap <= 600) s = 'WASPADA';
    else if (item.asap > 600) s = 'KRITIS';
    return s === filterStatus;
  });

  const cetakLaporan = () => {
    const dataPrint = [...dataLogTampil].reverse();
    if (dataPrint.length === 0) {
      alert("Tidak ada data untuk dicetak pada filter ini.");
      return;
    }
    const printWindow = window.open('', '_blank');
    const htmlIsi = `
      <html>
        <head>
          <title>Cetak Laporan - Smart Exhaust</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; }
            .kop { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .kop h2 { margin: 0; font-size: 24px; text-transform: uppercase; }
            .kop p { margin: 5px 0 0 0; color: #666; font-size: 14px; }
            .info { margin-bottom: 20px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f8f9fa; text-transform: uppercase; }
            .status-normal { color: #16a34a; font-weight: bold; }
            .status-waspada { color: #d97706; font-weight: bold; }
            .status-kritis { color: #dc2626; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="kop">
            <h2>Laporan Kualitas Udara (PPM)</h2>
            <p>Sistem Smart Exhaust & Smoke Detector</p>
          </div>
          <div class="info">
            <strong>Parameter Filter:</strong><br>
            Tanggal: ${filterTanggal === 'ALL' ? 'Semua Riwayat' : formatHariTanggal(filterTanggal)}<br>
            Kondisi: ${filterStatus === 'ALL' ? 'Semua Kondisi' : filterStatus}
          </div>
          <table>
            <thead>
              <tr>
                <th width="5%">No</th>
                <th width="20%">Tanggal</th>
                <th width="20%">Waktu</th>
                <th width="25%">Kadar Asap (PPM)</th>
                <th width="30%">Status Lingkungan</th>
              </tr>
            </thead>
            <tbody>
              ${dataPrint.map((item, index) => {
                let statusTeks = 'NORMAL';
                let kelasWarna = 'status-normal';
                if (item.asap >= 300 && item.asap <= 600) { statusTeks = 'WASPADA'; kelasWarna = 'status-waspada'; }
                else if (item.asap > 600) { statusTeks = 'KRITIS'; kelasWarna = 'status-kritis'; }
                return `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${formatHariTanggal(item.tanggal)}</td>
                    <td>${item.waktu}</td>
                    <td>${item.asap} PPM</td>
                    <td class="${kelasWarna}">${statusTeks}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlIsi);
    printWindow.document.close();
  };

  return (
    <div className={`${theme.bg} ${theme.textMain} min-h-screen pb-12 transition-colors duration-500 font-sans relative`}>
      
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] md:w-auto">
        <nav className={`${theme.nav} backdrop-blur-xl border shadow-2xl rounded-full px-5 py-2.5 flex justify-between items-center gap-4 sm:gap-6 transition-all duration-500`}>
          <div className="flex items-center gap-3">
            <h1 className="text-xs sm:text-sm font-black tracking-widest hidden sm:block mr-2">FIELDMONITOR</h1>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-300 ${statusAlat === 'ONLINE' ? 'bg-green-500/10 border-green-500/30 text-green-500' : (isDarkMode ? 'bg-neutral-800/80 border-neutral-700 text-neutral-400' : 'bg-slate-200/80 border-slate-300 text-slate-500')}`}>
              <div className="relative flex items-center justify-center">
                {statusAlat === 'ONLINE' ? (
                  <>
                    <div className="absolute w-2 h-2 rounded-full bg-green-500/80 animate-ping"></div>
                    <div className="relative w-2 h-2 rounded-full bg-green-500"></div>
                  </>
                ) : (
                  <div className={`relative w-2 h-2 rounded-full ${isDarkMode ? 'bg-neutral-500' : 'bg-slate-400'}`}></div>
                )}
              </div>
              <span className="text-[10px] font-bold tracking-widest">{statusAlat}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <span className={`text-[10px] sm:text-xs font-mono font-medium hidden md:block ${theme.textMuted}`}>{jam}</span>
            <div className={`hidden md:block w-px h-4 ${isDarkMode ? 'bg-neutral-800' : 'bg-slate-300'}`}></div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-sm hover:scale-110 transition-transform">
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={onLogout} className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white text-[10px] sm:text-xs px-4 py-1.5 rounded-full font-bold transition-all">
              LOGOUT
            </button>
          </div>
        </nav>
      </div>

      <div className="px-4 sm:px-6 pb-6 pt-32 max-w-7xl mx-auto space-y-6">
        
        {statusAlat === 'OFFLINE' && (
          <div className={`w-full p-4 rounded-[1.5rem] border flex items-center gap-4 animate-pulse transition-all duration-500 ${isDarkMode ? 'bg-[#1a1a1a]/80 border-neutral-800' : 'bg-slate-100 border-slate-200'}`}>
             <div className="w-12 h-12 rounded-full bg-neutral-500/20 flex items-center justify-center text-neutral-400 shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                </svg>
             </div>
             <div>
                <h3 className={`text-xs font-bold uppercase tracking-widest ${theme.textMain}`}>Koneksi Hardware Terputus</h3>
                <p className={`text-[10px] mt-1 ${theme.textMuted}`}>Sistem tidak menerima data baru dari ESP32 selama lebih dari 15 detik. Visualisasi di bawah adalah rekaman data terakhir yang tersimpan di server.</p>
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`${theme.bento} border rounded-[2rem] p-8 flex flex-col justify-between transition-all duration-500 shadow-sm`}>
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className={`text-xs font-bold uppercase tracking-widest ${theme.textMuted} mb-1`}>Air Quality</h2>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${badgeClass}`}>{teksStatus}</span>
              </div>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-7xl font-black tracking-tighter leading-none" style={{ color: warnaAksen }}>{kadarAsap}</span>
              <span className={`text-sm font-bold mb-2 ${theme.textMuted}`}>PPM</span>
            </div>
            <div className="w-full mt-8">
              <div className={`w-full h-1.5 rounded-full ${isDarkMode ? 'bg-neutral-800' : 'bg-slate-200'} overflow-hidden`}>
                <div className="h-full transition-all duration-1000 ease-out rounded-full" style={{ width: `${persentase}%`, backgroundColor: warnaAksen }}></div>
              </div>
            </div>
          </div>

          <div className={`${theme.bento} border rounded-[2rem] p-8 flex flex-col items-center justify-between transition-all duration-500 shadow-sm relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-10 blur-3xl transition-colors duration-1000" style={{ backgroundColor: activeSpeed !== 'OFF' ? warnaAksen : 'transparent' }}></div>
            <h2 className={`text-xs w-full text-center font-bold uppercase tracking-widest ${theme.textMuted} relative z-10`}>Exhaust Turbine</h2>
            <div className="relative w-40 h-40 flex items-center justify-center my-6">
              <div className={`absolute inset-0 rounded-full border-[10px] ${isDarkMode ? 'border-[#0a0a0a] bg-neutral-900/50' : 'border-slate-100 bg-slate-50'} shadow-inner`}></div>
              <svg viewBox="0 0 100 100" className={`w-full h-full relative z-10 transition-all duration-700 ${warnaBaling} ${shadowBaling} ${animasiKipas}`}>
                <g transform="translate(50,50)">
                  <path d="M0,0 C-15,-30 -30,-20 0,-40 C20,-20 10,-10 0,0" fill="currentColor" transform="rotate(0)" />
                  <path d="M0,0 C-15,-30 -30,-20 0,-40 C20,-20 10,-10 0,0" fill="currentColor" transform="rotate(120)" />
                  <path d="M0,0 C-15,-30 -30,-20 0,-40 C20,-20 10,-10 0,0" fill="currentColor" transform="rotate(240)" />
                  <circle cx="0" cy="0" r="8" fill={isDarkMode ? '#262626' : '#cbd5e1'} stroke="currentColor" strokeWidth="1" />
                </g>
              </svg>
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <p className={`text-[10px] font-bold uppercase tracking-widest ${theme.textMuted}`}>Status Output</p>
              <p className={`text-2xl font-black mt-1 ${activeSpeed === 'OFF' ? theme.textMain : ''}`} style={{ color: activeSpeed !== 'OFF' ? warnaAksen : '' }}>{activeSpeed}</p>
            </div>
          </div>

          {/* ================= AREA CONTROL CENTER ================= */}
          <div className={`${theme.bento} border rounded-[2rem] p-8 flex flex-col justify-between transition-all duration-500 shadow-sm`}>
            <div>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <h2 className={`text-xs font-bold uppercase tracking-widest ${theme.textMuted}`}>Control Center</h2>
                  {/* Indikator koneksi MQTT untuk kendali kipas */}
                  <div className={`w-1.5 h-1.5 rounded-full ${koneksiMqtt ? 'bg-blue-500' : 'bg-red-500'}`} title={koneksiMqtt ? "Kontrol Terhubung" : "Menghubungkan kontrol..."}></div>
                </div>
                <div className={`px-2 py-1 rounded text-[9px] font-bold tracking-widest ${isAuto ? 'bg-green-500/20 text-green-500' : 'bg-neutral-500/20 text-neutral-400'}`}>
                  {isAuto ? 'AUTO' : 'MANUAL'}
                </div>
              </div>
              
              {/* Event handler handleToggleMode disematkan di sini */}
              <div className={`p-4 rounded-xl border cursor-pointer hover:scale-[1.02] transition-transform flex items-center justify-between ${isDarkMode ? 'bg-[#1a1a1a] border-neutral-800' : 'bg-slate-50 border-slate-200'}`} 
                   onClick={handleToggleMode}>
                <span className="text-xs font-bold uppercase tracking-widest">System Mode</span>
                <div className={`w-12 h-6 rounded-full p-1 flex items-center transition-colors duration-300 ${isAuto ? 'bg-green-500' : (isDarkMode ? 'bg-neutral-600' : 'bg-slate-300')}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${isAuto ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
              </div>
            </div>

            <div className={`mt-8 transition-all duration-500 ${isAuto ? 'opacity-30 pointer-events-none grayscale blur-[1px]' : ''}`}>
              <div className="flex justify-between items-end mb-4">
                <h3 className={`text-[10px] font-bold uppercase tracking-widest ${theme.textMuted}`}>Drag to Adjust</h3>
                <span className="text-xl font-black">{manualSpeed}</span>
              </div>
              <div className="w-full relative py-2">
                
                {/* Event handler handleSliderChange disematkan di sini */}
                <input type="range" min="0" max="2" step="1" 
                       value={currentSpeedIndex} 
                       onChange={handleSliderChange} 
                       className={`w-full h-3 rounded-full appearance-none cursor-pointer focus:outline-none transition-all duration-300 ${isDarkMode ? 'bg-neutral-800' : 'bg-slate-300'}`}
                       style={{ background: `linear-gradient(to right, ${manualSpeed === 'OFF' ? '#64748b' : manualSpeed === 'LOW' ? '#eab308' : '#ef4444'} ${(currentSpeedIndex / 2) * 100}%, ${isDarkMode ? '#262626' : '#cbd5e1'} ${(currentSpeedIndex / 2) * 100}%)` }} />
                
                <div className="flex justify-between w-full mt-4">
                  <span className={`text-[10px] font-bold transition-colors ${manualSpeed === 'OFF' ? theme.textMain : theme.textMuted}`}>OFF</span>
                  <span className={`text-[10px] font-bold transition-colors ${manualSpeed === 'LOW' ? theme.textMain : theme.textMuted}`}>LOW</span>
                  <span className={`text-[10px] font-bold transition-colors ${manualSpeed === 'HIGH' ? theme.textMain : theme.textMuted}`}>HIGH</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* GRAFIK */}
        <div className={`${theme.bento} border rounded-[2rem] p-6 sm:p-8 transition-all duration-500 shadow-sm flex flex-col w-full`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h2 className={`text-xs font-bold uppercase tracking-widest ${theme.textMuted}`}>Live Fluctuation Chart</h2>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-bold uppercase ${theme.textMuted}`}>Filter Hari:</span>
              <select value={filterTanggal} onChange={(e) => setFilterTanggal(e.target.value)} className={`text-xs font-bold py-1.5 px-3 rounded-lg border outline-none cursor-pointer appearance-none transition-colors ${isDarkMode ? 'bg-[#1a1a1a] border-neutral-800 text-neutral-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <option value="ALL">Semua Hari</option>
                {opsiTanggalUnik.map((tgl, idx) => (
                  <option key={idx} value={tgl}>{formatHariTanggal(tgl)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataBerdasarkanTanggal} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAsap" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={warnaAksen} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={warnaAksen} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.gridLine} vertical={false} />
                <XAxis dataKey="fullDate" tickFormatter={(val) => val ? val.split(' ')[1] : ''} stroke={isDarkMode ? '#525252' : '#94a3b8'} fontSize={10} tickMargin={12} axisLine={false} tickLine={false} />
                <YAxis stroke={isDarkMode ? '#525252' : '#94a3b8'} fontSize={10} domain={[0, 1000]} axisLine={false} tickLine={false} />
                <Tooltip labelFormatter={(label) => { if(!label) return ''; const [tgl, jam] = label.split(' '); return `${formatHariTanggal(tgl)} | ${jam}`; }}
                  contentStyle={{ backgroundColor: isDarkMode ? '#1a1a1a' : '#fff', borderColor: theme.gridLine, borderRadius: '12px', color: isDarkMode ? '#fff' : '#000', fontSize: '12px' }} 
                  cursor={{ stroke: isDarkMode ? '#262626' : '#e2e8f0', strokeWidth: 2 }} />
                <Area type="monotone" dataKey="asap" stroke={warnaAksen} strokeWidth={3} fillOpacity={1} fill="url(#colorAsap)" activeDot={{ r: 6, strokeWidth: 0 }} animationDuration={300} />
              </AreaChart>
            </ResponsiveContainer>
            {dataBerdasarkanTanggal.length === 0 && <p className={`text-center text-xs mt-4 ${theme.textMuted}`}>Tidak ada data untuk tanggal ini.</p>}
          </div>
        </div>

        {/* ACTIVITY LOGS & DEVICE HISTORY */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto lg:h-[500px]">
          
          <div className={`${theme.bento} border rounded-[2rem] p-6 sm:p-8 flex flex-col transition-all duration-500 shadow-sm overflow-hidden h-[400px] lg:h-full`}>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                 <h2 className={`text-xs font-bold uppercase tracking-widest ${theme.textMuted}`}>Activity Logs</h2>
                 
                 <button onClick={cetakLaporan} className="flex items-center gap-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white px-3 py-1.5 rounded-full border border-blue-500/20 transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Cetak</span>
                 </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {['ALL', 'NORMAL', 'WASPADA', 'KRITIS'].map(status => (
                  <button key={status} onClick={() => setFilterStatus(status)} className={`text-[9px] font-bold tracking-widest px-3 py-1.5 rounded-full border transition-all ${filterStatus === status ? (status === 'NORMAL' ? 'bg-green-500 text-white border-green-500' : status === 'WASPADA' ? 'bg-yellow-500 text-white border-yellow-500' : status === 'KRITIS' ? 'bg-red-500 text-white border-red-500' : 'bg-blue-500 text-white border-blue-500') : (isDarkMode ? 'bg-[#1a1a1a] text-neutral-400 border-neutral-800' : 'bg-slate-50 text-slate-500 border-slate-200')}`}>
                    {status}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {dataLogTampil.length > 0 ? [...dataLogTampil].reverse().map((item, index) => {
                let dotColor = 'bg-green-500';
                let statusTeks = 'Normal';
                if (item.asap >= 300 && item.asap <= 600) { dotColor = 'bg-yellow-500'; statusTeks = 'Waspada'; }
                else if (item.asap > 600) { dotColor = 'bg-red-500'; statusTeks = 'Kritis'; }

                return (
                  <div key={index} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${isDarkMode ? 'bg-[#1a1a1a] border-neutral-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
                      <div>
                        <p className={`text-[10px] font-bold ${theme.textMuted}`}>{statusTeks}</p>
                        <p className="text-sm font-black">{item.asap} <span className="text-[10px] font-normal opacity-50">PPM</span></p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-mono font-medium opacity-60">{item.waktu}</p>
                      <p className="text-[9px] font-bold opacity-40">{formatHariTanggal(item.tanggal)}</p>
                    </div>
                  </div>
                );
              }) : (
                <div className={`text-center py-10 text-xs font-bold ${theme.textMuted}`}>Data tidak ditemukan.</div>
              )}
            </div>
          </div>

          <div className={`${theme.bento} border rounded-[2rem] p-6 sm:p-8 flex flex-col transition-all duration-500 shadow-sm overflow-hidden h-[400px] lg:h-full`}>
            <div className="mb-6">
              <h2 className={`text-xs font-bold uppercase tracking-widest mb-1 ${theme.textMuted}`}>Device Connection History</h2>
              <p className={`text-[10px] ${theme.textMuted}`}>Catatan offline & reconnect ESP32 (Gap &gt; 20s)</p>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {riwayatDevice.length > 0 ? riwayatDevice.map((log, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${isDarkMode ? 'bg-[#1a1a1a] border-neutral-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    </div>
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-widest text-red-500`}>Connection Lost</p>
                      <p className={`text-[10px] font-medium mt-0.5 ${theme.textMuted}`}>Offline durasi: <span className="font-bold text-white">{log.durasi} detik</span></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-[9px] font-bold ${theme.textMuted}`}>{formatHariTanggal(log.tanggal)}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                      <span className="text-[10px] font-mono text-red-400">{log.waktu_putus}</span>
                      <svg className="w-3 h-3 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                      <span className="text-[10px] font-mono text-green-400">{log.waktu_nyala}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className={`h-full flex flex-col items-center justify-center text-center py-10 opacity-50`}>
                   <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                   </div>
                   <p className={`text-xs font-bold ${theme.textMain}`}>Koneksi Stabil</p>
                   <p className={`text-[10px] ${theme.textMuted} mt-1`}>Tidak ada riwayat device offline tercatat.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}