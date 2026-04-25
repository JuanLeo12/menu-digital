import fs from 'fs';

try {
  let code = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

  // 1. types
  code = code.replace(
    'type Pedido = {',
    'type Configuracion = { id: number; local_abierto: boolean; whatsapp_numero: string; yape_numero: string; yape_qr: string; plin_numero: string; plin_qr: string; };\ntype Pedido = {'
  );

  // 2. Lucide
  code = code.replace(
    'Undo2,\n} from "lucide-react";',
    'Undo2,\n  Settings,\n  Store,\n  UploadCloud,\n  Smartphone,\n  Wallet,\n} from "lucide-react";'
  );

  // 3. state
  code = code.replace(
    'const [categorias, setCategorias] = useState<Categoria[]>([]);',
    'const [configuracion, setConfiguracion] = useState<Configuracion | null>(null);\n  const [categorias, setCategorias] = useState<Categoria[]>([]);'
  );

  code = code.replace(
    '"platos" | "categorias" | "pedidos" | "metricas"\n    >("pedidos");',
    '"platos" | "categorias" | "pedidos" | "metricas" | "configuracion"\n    >("pedidos");'
  );

  // 4. fetchData
  code = code.replace(
    'const fetchData = async (showLoading = true) => {\n    if (showLoading) setLoading(true);\n    const respCat = await supabase',
    'const fetchData = async (showLoading = true) => {\n    if (showLoading) setLoading(true);\n    const respConf = await supabase.from("configuracion").select("*").eq("id", 1).single();\n    const respCat = await supabase'
  );

  code = code.replace(
    'if (respCat.data) setCategorias(respCat.data);',
    'if (respConf.data) setConfiguracion(respConf.data as Configuracion);\n    if (respCat.data) setCategorias(respCat.data);'
  );

  // 5. useEffect 
  code = code.replace(
    'const init = async () => {\n      const respCat = await supabase',
    'const init = async () => {\n      const respConf = await supabase.from("configuracion").select("*").eq("id", 1).single();\n      const respCat = await supabase'
  );

  code = code.replace(
    'if (respCat.data) setCategorias(respCat.data);\n      if (respPlat.data)',
    'if (respConf.data) setConfiguracion(respConf.data as Configuracion);\n      if (respCat.data) setCategorias(respCat.data);\n      if (respPlat.data)'
  );

  // 6. Form State & handlers
  const configLogic = `
  // --- CONFIGURACION ---
  const [confTemp, setConfTemp] = useState<Configuracion | null>(null);
  const [yapeFile, setYapeFile] = useState<File | null>(null);
  const [plinFile, setPlinFile] = useState<File | null>(null);
  const yapeInputRef = useRef<HTMLInputElement>(null);
  const plinInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (configuracion && !confTemp) setConfTemp(configuracion);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configuracion]);

  const guardarConfiguracion = async () => {
    if (!confTemp) return;
    setLoading(true);
    let payload = { ...confTemp };
    if (yapeFile) {
      const ext = yapeFile.name.split(".").pop();
      const fn = generateFileName(ext);
      await supabase.storage.from("platos").upload(fn, yapeFile);
      const urlInfo = supabase.storage.from("platos").getPublicUrl(fn);
      payload.yape_qr = urlInfo.data.publicUrl;
    }
    if (plinFile) {
      const ext = plinFile.name.split(".").pop();
      const fn = generateFileName(ext);
      await supabase.storage.from("platos").upload(fn, plinFile);
      const urlInfo = supabase.storage.from("platos").getPublicUrl(fn);
      payload.plin_qr = urlInfo.data.publicUrl;
    }
    const { error } = await supabase.from("configuracion").update(payload).eq("id", 1);
    if(error) alert("Error guardando configuracion: " + error.message);
    else alert("¡Guardado correctamente!");
    setYapeFile(null);
    setPlinFile(null);
    await fetchData();
  };
`;

  code = code.replace('// --- PLATOS ---', configLogic + '\n  // --- PLATOS ---');

  // 7. Tabs
  const newTab = `        <button
          onClick={() => setActiveTab("configuracion")}
          className={\`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all \${activeTab === "configuracion" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}\`}
        >
          <Settings size={16} />
          Configuración
        </button>
      </div>`;
  code = code.replace('        </button>\n      </div>', '        </button>\n' + newTab);

  // 8. Tab Content
  const tabContent = `
          {activeTab === "configuracion" && confTemp && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                  <Settings className="text-orange-500" /> Configuración del Local
                </h2>
                <button onClick={guardarConfiguracion} className="bg-orange-500 text-white px-5 py-2.5 rounded-full font-semibold">
                  Guardar Cambios
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div className="flex gap-3 items-center">
                    <Store size={24} className={confTemp.local_abierto ? "text-emerald-500" : "text-red-500"} />
                    <div>
                      <p className="font-bold text-slate-800">Estado del Local</p>
                      <p className="text-sm text-slate-500">¿Está abierto y recibiendo pedidos?</p>
                    </div>
                  </div>
                  <input type="checkbox" checked={confTemp.local_abierto} onChange={e => setConfTemp({...confTemp, local_abierto: e.target.checked})} className="w-6 h-6" />
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-800 mb-2"><Smartphone size={18} className="inline mr-1"/> WhatsApp de recepción</p>
                  <input type="text" value={confTemp.whatsapp_numero || ''} onChange={e => setConfTemp({...confTemp, whatsapp_numero: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="Ej: 51902246535" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                    <p className="font-bold text-purple-900 mb-2"><Wallet size={18} className="inline mr-1"/> Número Yape</p>
                    <input type="text" value={confTemp.yape_numero || ''} onChange={e => setConfTemp({...confTemp, yape_numero: e.target.value})} className="w-full p-2 border rounded-lg mb-2" placeholder="Ej: 999888777" />
                    
                    <p className="font-bold text-purple-900 mb-2 text-sm mt-4">Código QR</p>
                    <input type="file" ref={yapeInputRef} className="hidden" onChange={e => setYapeFile(e.target.files?.[0] || null)} />
                    <div onClick={() => yapeInputRef.current?.click()} className="cursor-pointer border-2 border-dashed border-purple-300 p-4 rounded-lg bg-white text-center">
                      {yapeFile ? "QR Seleccionado" : confTemp.yape_qr ? <img src={confTemp.yape_qr} className="h-20 mx-auto" /> : "Clic para subir QR"}
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <p className="font-bold text-blue-900 mb-2"><Wallet size={18} className="inline mr-1"/> Número Plin</p>
                    <input type="text" value={confTemp.plin_numero || ''} onChange={e => setConfTemp({...confTemp, plin_numero: e.target.value})} className="w-full p-2 border rounded-lg mb-2" placeholder="Ej: 999888777" />
                    
                    <p className="font-bold text-blue-900 mb-2 text-sm mt-4">Código QR</p>
                    <input type="file" ref={plinInputRef} className="hidden" onChange={e => setPlinFile(e.target.files?.[0] || null)} />
                    <div onClick={() => plinInputRef.current?.click()} className="cursor-pointer border-2 border-dashed border-blue-300 p-4 rounded-lg bg-white text-center">
                      {plinFile ? "QR Seleccionado" : confTemp.plin_qr ? <img src={confTemp.plin_qr} className="h-20 mx-auto" /> : "Clic para subir QR"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}`;
  code = code.replace('          {activeTab === "metricas" && (', tabContent + '\n\n          {activeTab === "metricas" && (');

  fs.writeFileSync('src/app/admin/page.tsx', code, 'utf8');
  console.log("Admin OK");
} catch (e) { console.error("Admin Fail: ", e); }

try {
  let checkoutCode = fs.readFileSync('src/components/CheckoutModal.tsx', 'utf8');

  // Imports
  checkoutCode = checkoutCode.replace('import { X, MapPin, Store, Send, ShoppingBag } from \'lucide-react\'', 'import { X, MapPin, Store, Send, ShoppingBag, Banknote, CreditCard, Smartphone } from \'lucide-react\'');

  // State
  checkoutCode = checkoutCode.replace('const [mesa, setMesa] = useState(\'\')', 'const [mesa, setMesa] = useState(\'\')\n  const [medioPago, setMedioPago] = useState<\'yape\' | \'plin\' | \'efectivo\' | \'tarjeta\' | null>(null)\n  const [montoEfectivo, setMontoEfectivo] = useState(\'\')\n  const [config, setConfig] = useState<any>(null)\n\n  useEffect(() => { const f = async()=> { const supabase = createClient(); const r = await supabase.from("configuracion").select("*").eq("id", 1).single(); if(r.data) setConfig(r.data); }; f(); }, [])');

  const messageLogic = `
    let paymentText = "";
    if (medioPago === 'efectivo') paymentText = "\\n*Tipo de pago:* Efectivo\\n*Pagaré con:* S/ " + montoEfectivo;
    if (medioPago === 'tarjeta') paymentText = "\\n*Tipo de pago:* Tarjeta (Llevar POS)";
    if (medioPago === 'yape') paymentText = "\\n*Tipo de pago:* Yape (Envío captura en un momento)";
    if (medioPago === 'plin') paymentText = "\\n*Tipo de pago:* Plin (Envío captura en un momento)";
`;

  checkoutCode = checkoutCode.replace('let texto = `*NUEVO PEDIDO', 'if (!medioPago) return alert(\'Selecciona un medio de pago.\');\n    if (medioPago === \'efectivo\' && !montoEfectivo) return alert(\'Ingresa con cuánto vas a pagar.\');\n' + messageLogic + '\n    let texto = `*NUEVO PEDIDO');

  checkoutCode = checkoutCode.replace('texto += `\\nConfírmame la recepción de este pedido y envíame tu cuenta de Yape/Plin.`', 'texto += paymentText;');

  checkoutCode = checkoutCode.replace('const WHATSAPP_NUMBER = "51902246535"', '');
  checkoutCode = checkoutCode.replace(/const url = `https:\/\/api\.whatsapp\.com.*`/g, 'const DEST_PHONE = config?.whatsapp_numero || "51902246535";\n      const url = `https://api.whatsapp.com/send?phone=${DEST_PHONE}&text=${encodeURIComponent(texto)}`');

  const paymentUI = `
              {/* Selector de Medio de Pago */}
              <div className="space-y-3">
                <label className="font-semibold text-gray-700 text-sm">¿Cómo vas a pagar?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setMedioPago('yape')} className={\`flex items-center justify-center p-3 rounded-xl border-2 transition-all \${medioPago === 'yape' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-100 bg-white text-gray-500'}\`}>
                    <Smartphone size={20} className="mr-2" /> <span className="font-bold text-sm">Yape</span>
                  </button>
                  <button onClick={() => setMedioPago('plin')} className={\`flex items-center justify-center p-3 rounded-xl border-2 transition-all \${medioPago === 'plin' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 bg-white text-gray-500'}\`}>
                    <Smartphone size={20} className="mr-2" /> <span className="font-bold text-sm">Plin</span>
                  </button>
                  <button onClick={() => setMedioPago('efectivo')} className={\`flex items-center justify-center p-3 rounded-xl border-2 transition-all \${medioPago === 'efectivo' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 bg-white text-gray-500'}\`}>
                    <Banknote size={20} className="mr-2" /> <span className="font-bold text-sm">Efectivo</span>
                  </button>
                  <button onClick={() => setMedioPago('tarjeta')} className={\`flex items-center justify-center p-3 rounded-xl border-2 transition-all \${medioPago === 'tarjeta' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 bg-white text-gray-500'}\`}>
                    <CreditCard size={20} className="mr-2" /> <span className="font-bold text-sm">Tarjeta (POS)</span>
                  </button>
                </div>

                {/* Info adicional pago */}
                {medioPago === 'efectivo' && (
                  <div className="mt-3">
                    <label className="text-xs font-semibold text-gray-500 uppercase">¿Con cuánto vas a pagar? (S/)</label>
                    <input type="number" step="0.5" value={montoEfectivo} onChange={(e) => setMontoEfectivo(e.target.value)} placeholder="Ej. 100" className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500 transition-all font-medium" />
                  </div>
                )}
                {medioPago === 'yape' && config && (
                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl flex items-center justify-between text-center flex-col md:flex-row gap-4 mt-3">
                    <div>
                      <p className="text-sm text-purple-600 font-semibold mb-1">Yapea ahora al:</p>
                      <p className="text-xl font-bold text-purple-800">{config.yape_numero}</p>
                    </div>
                    {config.yape_qr && <img src={config.yape_qr} className="w-32 h-32 object-contain bg-white p-2 rounded-lg border border-purple-200 shadow-sm" />}
                  </div>
                )}
                {medioPago === 'plin' && config && (
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center justify-between text-center flex-col md:flex-row gap-4 mt-3">
                    <div>
                      <p className="text-sm text-blue-600 font-semibold mb-1">Plinea ahora al:</p>
                      <p className="text-xl font-bold text-blue-800">{config.plin_numero}</p>
                    </div>
                    {config.plin_qr && <img src={config.plin_qr} className="w-32 h-32 object-contain bg-white p-2 rounded-lg border border-blue-200 shadow-sm" />}
                  </div>
                )}
              </div>
`;

  checkoutCode = checkoutCode.replace('{/* Botón Finalizar */}', paymentUI + '\n\n              {/* Botón Finalizar */}');
  fs.writeFileSync('src/components/CheckoutModal.tsx', checkoutCode, 'utf8');
  console.log("Checkout OK");
} catch(e) { console.error("Checkout Fail: ", e); }

try {
  let pageCode = fs.readFileSync('src/app/page.tsx', 'utf8');
  pageCode = pageCode.replace('const [platos, setPlatos] = useState<Plato[]>([])', 'const [platos, setPlatos] = useState<Plato[]>([])\n  const [config, setConfig] = useState<any>(null)\n  const [isStoreClosed, setIsStoreClosed] = useState(false)');

  pageCode = pageCode.replace('const respCat = await supabase', 'const respConf = await supabase.from("configuracion").select("*").eq("id", 1).single();\n      if(respConf.data) {\n        setConfig(respConf.data);\n        setIsStoreClosed(!respConf.data.local_abierto);\n      }\n      const respCat = await supabase');

  const closedBanner = `
      {isStoreClosed && (
        <div className="bg-red-500 text-white text-center py-3 font-semibold sticky top-0 z-50 shadow-md">
          ⚠️ Nuestro local se encuentra cerrado en este momento. Vuelve pronto.
        </div>
      )}
`;
  pageCode = pageCode.replace('return (\n    <main', 'return (\n    <>\n      ' + closedBanner + '\n      <main');
  pageCode = pageCode.replace('</main>\n  )', '</main>\n    </>\n  )');

  pageCode = pageCode.replace('onClick={() => setIsCheckoutOpen(true)}', 'onClick={() => isStoreClosed ? alert("El local está cerrado en este momento.") : setIsCheckoutOpen(true)}');

  fs.writeFileSync('src/app/page.tsx', pageCode, 'utf8');
  console.log("Page OK");
} catch(e) { console.error("Page Fail: ", e); }
