import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Store, Send, ShoppingBag, Banknote, CreditCard, Smartphone } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { createClient } from '@/lib/supabase/client'
 // Tu número de prueba

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const cart = useCartStore()
  const [tipoPedido, setTipoPedido] = useState<'delivery' | 'salon' | 'recojo'>('delivery')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkoutMessage, setCheckoutMessage] = useState<{ type: 'error' | 'info'; text: string } | null>(null)
  
  // Formulario
  const [nombre, setNombre] = useState('')
  const [direccion, setDireccion] = useState('')
  const [referencia, setReferencia] = useState('')
  const [mesa, setMesa] = useState('')
  const [medioPago, setMedioPago] = useState<'yape' | 'plin' | 'efectivo' | 'tarjeta' | null>(null)
  const [montoEfectivo, setMontoEfectivo] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [config, setConfig] = useState<any>(null)
  const canInteract = !isSubmitting

  useEffect(() => {
    const supabase = createClient();
    const f = async () => {
      const r = await supabase.from("configuracion").select("*").eq("id", 1).single();
      if (r.data) setConfig(r.data);
      else setConfig({});
    };
    f();

    const channel = supabase
      .channel('checkout_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'schema_menu', table: 'configuracion' },
        () => {
          f();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [])

  useEffect(() => {
    // Al abrir el modal, revisamos los parámetros de la URL para autocompletar
    if (isOpen && typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const paramMesa = searchParams.get('mesa');
      const paramRecojo = searchParams.get('recojo');
      
      if (paramMesa) {
          setTimeout(() => {
            setTipoPedido("salon");
            setMesa(paramMesa);
          }, 0);
        } else if (paramRecojo === "true") {
          setTimeout(() => {
            setTipoPedido("recojo");
          }, 0);
        }
      }
    }, [isOpen]);

  const handleEnviar = async () => {
    const showValidationError = (text: string) => {
      setCheckoutMessage({ type: 'error', text })
    }

    if (isSubmitting) return
    setCheckoutMessage(null)
    if (cart.items.length === 0) return showValidationError('Tu carrito esta vacio.')
    if (!nombre.trim()) return showValidationError('Por favor, ingresa tu nombre.')
    if (tipoPedido === 'delivery' && !direccion.trim()) return showValidationError('Por favor, ingresa tu dirección.')
    if (tipoPedido === 'salon' && !mesa.trim()) return showValidationError('Por favor, ingresa tu numero de mesa.')

    if (!medioPago) return showValidationError('Selecciona un medio de pago.');
    if (medioPago === 'efectivo' && !montoEfectivo) return showValidationError('Ingresa con cuanto vas a pagar.');

    let paymentText = "";
    if (medioPago === 'efectivo') paymentText = "\n*Tipo de pago:* Efectivo\n*Pagaré con:* S/ " + montoEfectivo;
    if (medioPago === 'tarjeta') paymentText = "\n*Tipo de pago:* Tarjeta (Llevar POS)";
    if (medioPago === 'yape') paymentText = "\n*Tipo de pago:* Yape (Envío captura en un momento)";
    if (medioPago === 'plin') paymentText = "\n*Tipo de pago:* Plin (Envío captura en un momento)";

    let texto = `*NUEVO PEDIDO - ${tipoPedido.toUpperCase()}* 🛵

`
    texto += `*Cliente:* ${nombre}
`
    
    if (tipoPedido === 'delivery') {
      texto += `*Dirección:* ${direccion}
`
      if (referencia) texto += `*Referencia:* ${referencia}
`
    } else if (tipoPedido === 'salon') {
      texto += `*Mesa:* ${mesa}
`
    } else if (tipoPedido === 'recojo') {
      texto += `*(El cliente pasará a recoger el pedido al local)*
`
    }

    texto += `
*DETALLE DEL PEDIDO:*
`
    cart.items.forEach(item => {
      texto += `• ${item.cantidad}x ${item.nombre} (S/ ${(item.precio * item.cantidad).toFixed(2)})
`
    })
    
    texto += `
*TOTAL A PAGAR: S/ ${cart.getTotal().toFixed(2)}*
`
    texto += paymentText;
    
    texto += `
Confírmame la recepción de este pedido y envíame tu cuenta de Yape/Plin.`

    
    setCheckoutMessage({ type: 'info', text: 'Registrando pedido...' })
    setIsSubmitting(true)
    try {
      // Guardar pedido en Supabase antes de abrir WhatsApp.
      const supabase = createClient()
      const detalle_json = cart.items.map(item => ({
        id: item.id,
        nombre: item.nombre,
        cantidad: item.cantidad,
        precio: item.precio
      }))

      const { error } = await supabase.from("pedidos").insert([{
        cliente_nombre: nombre,
        tipo_pedido: tipoPedido,
        direccion: tipoPedido === "delivery" ? direccion : null,
        referencia: tipoPedido === "delivery" ? referencia : null,
        mesa: tipoPedido === "salon" ? mesa : null,
        total: cart.getTotal(),
        estado: "PENDIENTE",
        detalle: detalle_json
      }])

      if (error) {
        console.error("Error guardando pedido:", error)
        setCheckoutMessage({ type: 'error', text: 'No se pudo registrar tu pedido. Intentalo nuevaMenúte.' })
        return
      }

      const DEST_PHONE = config?.whatsapp_numero || "51902246535";
      const url = `https://api.whatsapp.com/send?phone=${DEST_PHONE}&text=${encodeURIComponent(texto)}`
      window.open(url, '_blank')

      cart.clearCart()
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!canInteract) return
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay oscuro */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
          />

          {/* Modal Modal (Bottom Sheet style for mobile) */}
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto w-full max-w-md mx-auto flex flex-col"
          >
            {/* Header del Modal */}
            <div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex items-center justify-between z-10 rounded-t-3xl">
              <h2 className="font-bold text-lg text-gray-800">Finalizar Pedido</h2>
              <button
                onClick={handleClose}
                disabled={!canInteract}
                className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {checkoutMessage && (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                    checkoutMessage.type === 'error'
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : 'border-orange-200 bg-orange-50 text-orange-700'
                  }`}
                >
                  {checkoutMessage.text}
                </div>
              )}

              {/* ResuMenú del Carrito Corto */}
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-orange-900">Total a pagar:</span>
                  <span className="font-bold text-xl text-orange-700">S/ {cart.getTotal().toFixed(2)}</span>
                </div>
                <p className="text-sm text-orange-600/80">{cart.getTotalItems()} productos en el carrito</p>
              </div>

              {/* Selector de Tipo de Pedido */}
              <div className="space-y-3">
                <label className="font-semibold text-gray-700 text-sm">¿Cómo deseas recibir tu pedido?</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setTipoPedido('delivery')}
                    disabled={!canInteract}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                      tipoPedido === 'delivery' 
                        ? 'border-orange-500 bg-orange-50 text-orange-700' 
                        : 'border-gray-100 bg-white text-gray-500'
                    } disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    <MapPin size={22} className="mb-1" />
                    <span className="font-semibold text-xs text-center">Delivery</span>
                  </button>
                  <button 
                    onClick={() => setTipoPedido('recojo')}
                    disabled={!canInteract}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                      tipoPedido === 'recojo' 
                        ? 'border-orange-500 bg-orange-50 text-orange-700' 
                        : 'border-gray-100 bg-white text-gray-500'
                    } disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    <ShoppingBag size={22} className="mb-1" />
                    <span className="font-semibold text-xs text-center">Recojo</span>
                  </button>
                  <button 
                    onClick={() => setTipoPedido('salon')}
                    disabled={!canInteract}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                      tipoPedido === 'salon' 
                        ? 'border-orange-500 bg-orange-50 text-orange-700' 
                        : 'border-gray-100 bg-white text-gray-500'
                    } disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    <Store size={22} className="mb-1" />
                    <span className="font-semibold text-xs text-center">En Local</span>
                  </button>
                </div>
              </div>

              {/* Formulario Dinámico */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tu Nombre</label>
                  <input 
                    type="text" 
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    disabled={!canInteract}
                    placeholder="Ej. Juan Pérez" 
                    className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-medium"
                  />
                </div>

                {tipoPedido === 'delivery' && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dirección de Envío</label>
                      <input 
                        type="text" 
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                        disabled={!canInteract}
                        placeholder="Ej. Av. Larco 123, Miraflores" 
                        className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Referencia (Opcional)</label>
                      <input 
                        type="text" 
                        value={referencia}
                        onChange={(e) => setReferencia(e.target.value)}
                        disabled={!canInteract}
                        placeholder="Ej. Frente al parque, reja negra" 
                        className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-medium"
                      />
                    </div>
                  </>
                )}
                
                {tipoPedido === 'salon' && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Número de Mesa</label>
                    <input 
                      type="number" 
                      value={mesa}
                      onChange={(e) => setMesa(e.target.value)}
                      placeholder="Ej. 4" 
                      className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-medium"
                      readOnly={!canInteract || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('mesa'))}
                    />
                    {typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('mesa') && (
                      <p className="text-xs text-orange-600 mt-1">Mesa asignada automáticaMenúte por el QR.</p>
                    )}
                  </div>
                )}
                
                {/* Si es 'recojo', no necesitamos pedir nada más aparte del nombre */}
              </div>

              {/* Selector de Medio de Pago */}
              <div className="space-y-3 mt-6">
                <label className="font-semibold text-gray-700 text-sm">¿Cómo vas a pagar?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button disabled={!canInteract} onClick={() => setMedioPago('yape')} className={`flex items-center justify-center p-3 rounded-xl border-2 transition-all ${medioPago === 'yape' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-100 bg-white text-gray-500'} disabled:cursor-not-allowed disabled:opacity-70`}>
                    <Smartphone size={20} className="mr-2" /> <span className="font-bold text-sm">Yape</span>
                  </button>
                  <button disabled={!canInteract} onClick={() => setMedioPago('plin')} className={`flex items-center justify-center p-3 rounded-xl border-2 transition-all ${medioPago === 'plin' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 bg-white text-gray-500'} disabled:cursor-not-allowed disabled:opacity-70`}>
                    <Smartphone size={20} className="mr-2" /> <span className="font-bold text-sm">Plin</span>
                  </button>
                  <button disabled={!canInteract} onClick={() => setMedioPago('efectivo')} className={`flex items-center justify-center p-3 rounded-xl border-2 transition-all ${medioPago === 'efectivo' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 bg-white text-gray-500'} disabled:cursor-not-allowed disabled:opacity-70`}>
                    <Banknote size={20} className="mr-2" /> <span className="font-bold text-sm">Efectivo</span>
                  </button>
                  <button disabled={!canInteract} onClick={() => setMedioPago('tarjeta')} className={`flex items-center justify-center p-3 rounded-xl border-2 transition-all ${medioPago === 'tarjeta' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 bg-white text-gray-500'} disabled:cursor-not-allowed disabled:opacity-70`}>
                    <CreditCard size={20} className="mr-2" /> <span className="font-bold text-sm">Tarjeta (POS)</span>
                  </button>
                </div>

                {/* Info adicional pago */}
                {medioPago === 'efectivo' && (
                  <div className="mt-3">
                    <label className="text-xs font-semibold text-gray-500 uppercase">¿Con cuánto vas a pagar? (S/)</label>
                    <input type="number" step="0.5" value={montoEfectivo} onChange={(e) => setMontoEfectivo(e.target.value)} disabled={!canInteract} placeholder="Ej. 100" className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500 transition-all font-medium disabled:opacity-70" />
                  </div>
                )}
                {medioPago === 'yape' && config && (
                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl flex items-center justify-between text-center flex-col md:flex-row gap-4 mt-3">
                    <div>
                      <p className="text-sm text-purple-600 font-semibold mb-1">Yapea ahora al:</p>
                      <p className="text-xl font-bold text-purple-800">{config.yape_numero}</p>
                    </div>
                    {config.yape_qr && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={config.yape_qr} alt="QR Yape" className="w-32 h-32 object-contain bg-white p-2 rounded-lg border border-purple-200 shadow-sm" />
                    )}
                  </div>
                )}
                {medioPago === 'plin' && config && (
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center justify-between text-center flex-col md:flex-row gap-4 mt-3">
                    <div>
                      <p className="text-sm text-blue-600 font-semibold mb-1">Plinea ahora al:</p>
                      <p className="text-xl font-bold text-blue-800">{config.plin_numero}</p>
                    </div>
                    {config.plin_qr && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={config.plin_qr} alt="QR Plin" className="w-32 h-32 object-contain bg-white p-2 rounded-lg border border-blue-200 shadow-sm" />
                    )}
                  </div>
                )}
              </div>

              {/* Botón de Enviar a WhatsApp */}
              <p className="text-xs text-gray-500 -mt-2">
                Primero registramos tu pedido y luego te redirigimos a WhatsApp para enviarlo.
              </p>
              <button 
                onClick={handleEnviar}
                disabled={!canInteract}
                className="w-full bg-[#25D366] hover:bg-[#20BE5A] text-white rounded-2xl py-4 font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/30 transition-all active:scale-95 mt-6 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Send size={20} />
                {isSubmitting ? 'Registrando pedido...' : 'Enviar Pedido por WhatsApp'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}



