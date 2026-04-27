const fs = require('fs');
const filepath = 'src/app/page.tsx';
let txt = fs.readFileSync(filepath, 'utf8');

txt = txt.replace(/aut.ntico/g, 'auténtico')
         .replace(/.nicos/g, 'únicos')
         .replace(/Men./g, 'Menú')
         .replace(/M.s Informaci.n/g, 'Más Información')
         .replace(/Informaci.n/g, 'Información')
         .replace(/categor.a/g, 'categoría')
         .replace(/Categor.as/g, 'Categorías')
         .replace(/Caracter.sticas/g, 'Características')
         .replace(/Secci.n/g, 'Sección')
         .replace(/Dise.o/g, 'Diseño')
         .replace(/sal.n/g, 'salón');

const heroRegex = /\{\/\* Hero Section - ULTRA MODERNO \*\/\}[\s\S]*?\{\/\* Secci\w+ de Caracter\w+ - GLASSMORPHISM \*\/\}/i;

const rep = \{/* Hero Section - REDISEÑADO AMIGABLE Y ENVOLVENTE */}
          <motion.section 
            className="relative w-full h-[60vh] flex flex-col items-center justify-center p-4 overflow-hidden border-b border-white/10"
            style={{ opacity: heroOpacity, scale: heroScale }}
          >
            <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
               <Image 
                  src="/imagen_principal.png" 
                  alt="Fondo Principal El Pollo Bravo" 
                  fill 
                  quality={100}
                  className="object-cover relative z-0"
                  priority
               />
               <div className="absolute inset-0 bg-linear-to-b from-black/80 via-black/50 to-black z-10" />
            </div>

            <div className="relative z-20 text-center flex flex-col items-center justify-center h-full w-full max-w-5xl mx-auto pt-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="flex items-center justify-center gap-3 mb-4"
                >
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                  <span className="text-xl md:text-2xl font-bold text-yellow-400 uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    El Mejor Sabor
                  </span>
                </motion.div>

                <motion.h1 
                  className="text-6xl md:text-8xl font-black mb-6 text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)]"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.4, type: "spring" }}
                >
                  El Pollo Bravo
                </motion.h1>

                <motion.p 
                  className="text-xl md:text-2xl text-gray-100 mb-10 max-w-2xl mx-auto drop-shadow-lg font-medium leading-relaxed px-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  El auténtico sabor del pollo a la brasa, con el toque especial que nos hace únicos.
                </motion.p>

                <motion.div 
                  className="flex flex-col sm:flex-row gap-5 justify-center items-center relative z-50 pointer-events-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                >
                  <button
                    onClick={() => setActiveTab("menu")}
                    className="relative px-8 py-4 bg-linear-to-r from-red-600 via-orange-500 to-yellow-500 rounded-full font-bold text-xl text-white shadow-[0_0_30px_rgba(239,68,68,0.5)] overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
                  >
                    <UtensilsCrossed size={24} />
                    Ver Menú y Pedir
                  </button>

                  <button
                    onClick={() => {
                      document.getElementById('info')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="relative px-8 py-4 border-2 border-white/50 bg-black/40 backdrop-blur-md rounded-full font-bold text-xl text-white shadow-lg transition-all duration-300 hover:bg-white/20 hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-3"
                  >
                    <Info size={24} />
                    Más Información
                  </button>
                </motion.div>
            </div>
            
            <motion.div 
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="w-10 h-10 text-white/50" />
            </motion.div>
          </motion.section>

          {/* Sección de Características - GLASSMORPHISM */}
\;

txt = txt.replace(heroRegex, rep);
fs.writeFileSync(filepath, txt, 'utf8');
console.log('Fixed page!');
