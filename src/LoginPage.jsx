import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'motion/react';
import { ArrowRight, Wifi, ShieldCheck, ChevronDown } from 'lucide-react';

export default function LoginPage({ onLoginSuccess, onGoBack }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const BASE_URL = "/api";
  const spotifyGreen = '#1ed760';

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${BASE_URL}/login.php`, {
        username: username,
        password: password
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.data.status === 'success') {
        localStorage.setItem('api_token', response.data.token);
        onLoginSuccess(response.data.token);
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Koneksi ke Server Gagal');
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToSetup = () => {
    document.getElementById('setup-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen w-full font-sans text-white selection:bg-[#1ed760] selection:text-black">
      {/* PERSISTENT BACKGROUND - Fixed layer */}
      <div className="fixed inset-0 -z-30 bg-black overflow-hidden">
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: 1.1 }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "alternate", ease: "easeInOut" }}
          className="h-full w-full bg-center bg-cover opacity-80"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1920&q=80')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/80" />
      </div>

      {/* SECTION 1: LOGIN FORM */}
      <section className="relative min-h-screen flex items-center justify-start lg:px-32 md:px-24 px-12 py-20">
        <motion.main
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex flex-col items-start text-left max-w-4xl pt-10"
        >
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 0.6 }} 
            className="text-[10px] md:text-xs tracking-[0.5em] font-medium mb-6 uppercase"
          >
            OTORISASI AKSES SISTEM
          </motion.div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] mb-6">
            Masuk ke <br />
            <span className="text-white">Dashboard Anda</span>
          </h1>
          
          <p className="text-sm md:text-base tracking-wide font-light opacity-60 mb-10 max-w-md leading-relaxed">
            Gunakan kredensial Anda untuk mengakses sistem monitoring asap real-time.
          </p>

          {/* FORM LOGIN */}
          <form onSubmit={handleLogin} className="w-full max-w-sm flex flex-col gap-4 z-10">
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-xs p-3 rounded-xl mb-2 text-center font-medium">
                {errorMsg}
              </div>
            )}
            
            <div className="space-y-3 mb-4">
              <input
                type="text"
                placeholder="Username"
                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#1ed760] transition-colors backdrop-blur-sm text-sm"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#1ed760] transition-colors backdrop-blur-sm text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02, backgroundColor: '#22e86a' }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-xl font-bold text-black transition-all shadow-[0_15px_40px_rgba(30,215,96,0.2)] tracking-wider disabled:opacity-50"
              style={{ backgroundColor: spotifyGreen }}
              disabled={isLoading}
            >
              {isLoading ? 'MEMVERIFIKASI...' : 'OTORISASI AKSES'}
            </motion.button>
          </form>

          <div className="flex gap-4 mt-8">
            <button 
              onClick={onGoBack}
              type="button"
              className="text-xs md:text-sm font-semibold opacity-50 hover:opacity-100 transition-all"
            >
              ← Kembali
            </button>
            <button 
              onClick={scrollToSetup}
              type="button"
              className="group flex items-center gap-3 text-xs md:text-sm font-semibold opacity-50 hover:opacity-100 transition-all ml-auto"
            >
              Belum konfigurasi Wifi? <span className="underline decoration-[#1ed760] underline-offset-8 decoration-2">Sambungkan sekarang</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.main>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-30 hidden md:block"
        >
          <ChevronDown size={24} />
        </motion.div>
      </section>

      {/* SECTION 2: SETUP */}
      <section id="setup-section" className="relative min-h-screen flex items-center justify-center py-24 px-6 md:px-12 bg-black/40 backdrop-blur-md">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
          
          {/* Header Area */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="space-y-8"
            >
              <div className="w-16 h-16 bg-[#1ed760]/10 rounded-2xl flex items-center justify-center border border-[#1ed760]/20 shadow-[0_0_50px_rgba(30,215,96,0.1)]">
                <Wifi className="text-[#1ed760]" size={32} />
              </div>
              <h2 className="text-5xl md:text-6xl font-black tracking-tight leading-[0.95]">
                Omahe Janet <br />
                <span className="text-[#1ed760]">WiFi Setup</span>
              </h2>
              <p className="text-white/40 leading-relaxed font-light max-w-sm">
                Langkah sederhana untuk memastikan privasi dan keamanan Anda selalu terjaga melalui sistem sensor pintar kami.
              </p>
              
              <div className="pt-4">
                <div className="inline-flex items-center gap-4 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl">
                  <ShieldCheck className="text-[#1ed760]" size={20} />
                  <p className="text-[10px] font-bold tracking-widest text-white/80 uppercase">SISTEM TERENKRIPSI</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Steps Area */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { number: 1, title: "Akses Jaringan", text: "Buka Pengaturan WiFi di smartphone Anda sekarang." },
                { number: 2, title: "Pilih SSID", text: "Hubungkan ke jaringan bernama ESP-Smoke-Setup." },
                { number: 3, title: "Konfigurasi", text: "Pilih WiFi Kost Omahe Janet, masukkan password, lalu Save." },
                { number: 4, title: "Aktivasi", text: "ESP32 akan restart otomatis dan masuk ke sistem utama." },
              ].map((step, idx) => (
                <motion.div 
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: idx * 0.15 }}
                  className="p-8 bg-white/[0.03] border border-white/5 rounded-[32px] hover:bg-white/[0.06] hover:border-[#1ed760]/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-sm mb-6 group-hover:bg-[#1ed760] group-hover:text-black transition-colors">
                    {step.number}
                  </div>
                  <h4 className="text-lg font-bold mb-3 group-hover:text-[#1ed760] transition-colors">{step.title}</h4>
                  <p className="text-sm font-light opacity-50 leading-relaxed">{step.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* GLOBAL FOOTER */}
      <footer className="py-12 px-6 flex flex-col md:flex-row items-center justify-between border-t border-white/5 text-[10px] tracking-widest uppercase opacity-30 gap-6">
        <div>© 2026 Kost Omahe Janet</div>
        <div className="flex gap-8">
          <a href="#" className="hover:text-white transition-colors">Safety Protocol</a>
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
        </div>
        <div>+62 812 3456 7890</div>
      </footer>
    </div>
  );
}
