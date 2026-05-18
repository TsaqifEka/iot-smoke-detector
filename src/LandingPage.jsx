import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ChevronDown } from 'lucide-react';

export default function LandingPage({ onGoToLogin }) {
  const spotifyGreen = '#1ed760';

  return (
    <div className="relative min-h-screen w-full font-sans text-white selection:bg-[#1ed760] selection:text-black">
      {/* PERSISTENT BACKGROUND - Fixed layer */}
      <div className="fixed inset-0 -z-30 bg-black overflow-hidden">
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: 1.1 }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "alternate", ease: "easeInOut" }}
          className="h-full w-full bg-center bg-cover opacity-80"
          style={{ backgroundImage: "url('  ')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/80" />
      </div>

      {/* MAIN SECTION */}
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
            PREMIUM LIVING SPACE
          </motion.div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] mb-6">
            Kost <br />
            <span className="text-white">Omahe Janet</span>
          </h1>
          
          <p className="text-sm md:text-base tracking-wide font-light opacity-60 mb-10 max-w-md leading-relaxed">
            Smart smoke detector for your room. Providing high-end safety and comfort for your exclusive stay.
          </p>

          {/* BUTTON GO TO LOGIN */}
          <motion.button
            onClick={onGoToLogin}
            whileHover={{ scale: 1.02, backgroundColor: '#22e86a' }}
            whileTap={{ scale: 0.98 }}
            className="py-4 px-8 rounded-xl font-bold text-black transition-all shadow-[0_15px_40px_rgba(30,215,96,0.2)] tracking-wider flex items-center gap-3"
            style={{ backgroundColor: spotifyGreen }}
          >
            Masuk Sistem
            <ArrowRight size={18} />
          </motion.button>

          <p className="text-xs text-white/40 mt-6 font-light">
            Gunakan kredensial Anda untuk mengakses dashboard monitoring asap
          </p>
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
