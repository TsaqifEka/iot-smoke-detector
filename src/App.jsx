import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function App() {
  // State keamanan dan user
  const [token, setToken] = useState(localStorage.getItem('api_token') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // State dashboard dan data
  const [kadarAsap, setKadarAsap] = useState(0);
  const [waktuTerakhir, setWaktuTerakhir] = useState("Memuat...");
  const [riwayat, setRiwayat] = useState([]);
  const [koneksiError, setKoneksiError] = useState(false);
  const [jam, setJam] = useState("");
  const [isAuto, setIsAuto] = useState(true);

  // URL Server VM (pastikan ada http:// di depannya)
  const BASE_URL = "http://192.168.1.11/iot-asap";

  // Efek jam real-time
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const optionsDate = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
      setJam(`${now.toLocaleDateString('id-ID', optionsDate)} | ${now.toLocaleTimeString('id-ID', { hour12: false })} WIB`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Proses login
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const response = await axios.post(`${BASE_URL}/login.php`, {
        username: username,
        password: password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.status === 'success') {
        setToken(response.data.token);
        localStorage.setItem('api_token', response.data.token);
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Koneksi ke Server Gagal');
    }
  };

  // Proses logout
  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('api_token');
    setKadarAsap(0);
    setRiwayat([]);
  };

  // Ambil data dari API
  const ambilData = async () => {
    if (!token) return;

    try {
      const response = await axios.get(`${BASE_URL}/api.php`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = response.data;
      
      if (data && data.length > 0) {
        setKadarAsap(parseInt(data[0].nilai_asap) || 0);
        setWaktuTerakhir(data[0].waktu);
        
        const dataGrafik = [...data].reverse().map(item => ({
          waktu: item.waktu ? item.waktu.split(' ')[1] : '', 
          asap: parseInt(item.nilai_asap)
        }));
        
        setRiwayat(dataGrafik);
      }
      
      setKoneksiError(false);
    } catch (error) {
      setKoneksiError(true);
      if (error.response?.status === 401) {
        handleLogout();
      }
    }
  };

  // Auto-refresh data tiap 2 detik
  useEffect(() => {
    if (token) {
      ambilData();
      const interval = setInterval(ambilData, 2000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // Logika status UI dashboard
  let teksStatus = 'NORMAL';
  let warnaGrafik = '#22c55e'; 
  let bgBadge = 'bg-green-500/20 text-green-500';
  let kipasNyala = false;

  if (kadarAsap >= 500 && kadarAsap <= 1000) {
    teksStatus = 'WASPADA';
    warnaGrafik = '#eab308'; 
    bgBadge = 'bg-yellow-500/20 text-yellow-500';
    kipasNyala = true;
  } else if (kadarAsap > 1000) {
    teksStatus = 'KRITIS';
    warnaGrafik = '#ef4444'; 
    bgBadge = 'bg-red-500/20 text-red-500';
    kipasNyala = true;
  }

  const persentase = Math.round((kadarAsap / 4095) * 100);

  // Render halaman login
  if (!token) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-sans text-white">
        <form onSubmit={handleLogin} className="bg-[#121212] p-8 rounded-xl shadow-2xl w-full max-w-md border border-neutral-800">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-1 text-center tracking-wider">IoT <span className="text-green-500">FieldMonitor</span></h2>
          <p className="text-neutral-500 text-sm text-center mb-8">Sistem Mitigasi Asap Rokok Terenkripsi</p>
          
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded mb-6 text-center font-medium">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs text-neutral-500 uppercase font-semibold mb-1 block">Username</label>
              <input
                type="text"
                className="w-full p-3 bg-[#1a1a1a] border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 uppercase font-semibold mb-1 block">Password</label>
              <input
                type="password"
                className="w-full p-3 bg-[#1a1a1a] border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg mt-8 transition-colors duration-200 uppercase tracking-widest text-sm">
            Otorisasi Akses
          </button>
        </form>
      </div>
    );
  }

  // Render dashboard utama
  return (
    <div className="bg-[#0a0a0a] font-sans antialiased text-white min-h-screen pb-10">
      <nav className="bg-[#121212] border-b border-neutral-800 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full animate-pulse ${koneksiError ? 'bg-red-600' : 'bg-green-500'}`}></div>
          <h1 className="text-xl font-bold tracking-wider hidden sm:block">IoT <span className="text-green-500">FieldMonitor</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm font-mono text-neutral-400 bg-[#1a1a1a] px-3 py-1.5 rounded-md border border-neutral-800">
            {koneksiError ? <span className="text-red-500">API Terputus!</span> : <span>{jam}</span>}
          </div>
          <button 
            onClick={handleLogout} 
            className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/50 text-xs px-4 py-1.5 rounded-md font-bold transition-colors"
          >
            LOGOUT
          </button>
        </div>
      </nav>

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#121212] border border-neutral-800 rounded-xl p-5 shadow-lg flex flex-col items-center">
            <div className="flex justify-between items-center w-full mb-4">
              <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest">Kadar Asap</h2>
              <span className={`text-xs font-bold px-2 py-1 rounded ${bgBadge}`}>{teksStatus}</span>
            </div>
            <div className="relative flex justify-center items-center mt-4 mb-2">
              <svg className="w-48 h-48 transform -rotate-90">
                <circle cx="96" cy="96" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-neutral-800" />
                <circle cx="96" cy="96" r="70" stroke={warnaGrafik} strokeWidth="12" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - ((persentase > 100 ? 100 : persentase) / 100) * 440} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-white">{kadarAsap}</span>
                <span className="text-xs font-bold text-neutral-400 mt-1">PPM</span>
              </div>
            </div>
            <p className="text-center text-xs text-neutral-500 mt-2">Kapasitas Maksimal: 4095</p>
          </div>

          <div className="bg-[#121212] border border-neutral-800 rounded-xl p-5 shadow-lg flex flex-col justify-center">
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-6">Exhaust Fan Status</h2>
            <div className="flex items-center justify-between px-4">
              <div>
                <p className="text-xs text-neutral-500 mb-1">Status Kipas (Relay)</p>
                <p className="text-4xl font-bold text-white">{kipasNyala ? "ON" : "OFF"}</p>
              </div>
              <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center transition-colors duration-500 ${kipasNyala ? 'border-green-500 text-green-500' : 'border-neutral-700 text-neutral-700'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${kipasNyala ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-[#121212] border border-neutral-800 rounded-xl p-5 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest">Manual Control</h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={isAuto} onChange={() => setIsAuto(!isAuto)} />
                <div className="w-11 h-6 bg-neutral-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green-500 after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                <span className="ml-3 text-xs font-medium text-neutral-300">Auto Mode</span>
              </label>
            </div>
            <div className="space-y-4 opacity-50 cursor-not-allowed mt-8">
              <div className="h-1 w-full bg-neutral-700 rounded-lg"></div>
              <div className="h-1 w-full bg-neutral-700 rounded-lg mt-4"></div>
              <p className="text-[10px] text-yellow-500 italic text-center mt-4">*Kontrol masih disabled pada tahap ini</p>
            </div>
          </div>
        </div>

        <div className="bg-[#121212] border border-neutral-800 rounded-xl p-5 shadow-lg">
          <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-6">Grafik Fluktuasi Asap Real-time</h2>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={riwayat}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="waktu" stroke="#737373" fontSize={12} tickMargin={10} />
                <YAxis stroke="#737373" fontSize={12} domain={[0, 4095]} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#262626', color: '#fff' }} />
                <Line type="monotone" dataKey="asap" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: '#22c55e' }} activeDot={{ r: 6 }} animationDuration={500} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#121212] border border-neutral-800 rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-800">
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest">Logs Data</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#1a1a1a] text-neutral-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Waktu Deteksi</th>
                  <th className="px-6 py-3 font-medium">Value (PPM)</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-neutral-300">
                {[...riwayat].reverse().map((item, index) => (
                  <tr key={index} className="hover:bg-neutral-900/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-neutral-400">{item.waktu}</td>
                    <td className="px-6 py-4 font-semibold text-white">{item.asap}</td>
                    <td className="px-6 py-4 font-medium">
                      {item.asap < 500 ? (
                        <><span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-2"></span> <span className="text-green-500">Normal</span></>
                      ) : item.asap <= 1000 ? (
                        <><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block mr-2"></span> <span className="text-yellow-500">Waspada</span></>
                      ) : (
                        <><span className="w-2 h-2 rounded-full bg-red-500 inline-block mr-2"></span> <span className="text-red-500">Kritis</span></>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;