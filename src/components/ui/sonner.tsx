import { Toaster as Sonner, toast } from "sonner"
import { useLocation } from "react-router-dom"

const Toaster = () => {
  const location = useLocation()

  // Determinar o tipo de página para ajustar o posicionamento
  const isAuthPage = location.pathname === '/auth'
  const isEventPage = location.pathname.startsWith('/eventos/')
  const isCheckoutPage = location.pathname === '/compra'
  const isNotFoundPage = location.pathname === '/404'

  // Calcular margem superior baseada no tipo de página
  const getMarginTop = () => {
    if (isAuthPage || isNotFoundPage) {
      return "20px" // Páginas sem header
    }
    if (isEventPage || isCheckoutPage) {
      return "20px" // Páginas públicas
    }
    return "80px" // Páginas com header
  }

  return (
    <Sonner
      position="top-right"
      theme="dark"
      className="toaster"
      style={
        {
          "--normal-bg": "transparent",
          "--normal-border": "transparent",
        } as React.CSSProperties
      }
      toastOptions={{
        style: {
          marginTop: getMarginTop(),
          marginRight: "20px",
        },
        className: "custom-toast",
        classNames: {
          toast: "bg-black/90 backdrop-blur-lg border border-gray-800/50 text-white shadow-2xl rounded-xl",
          title: "text-white font-semibold",
          description: "text-gray-300",
          actionButton: "bg-primary-green text-black font-semibold hover:bg-primary-green/90",
          cancelButton: "bg-gray-700 text-white hover:bg-gray-600",
          closeButton: "text-gray-400 hover:text-white",
        },
        duration: 4000,
      }}
    />
  )
}

export { Toaster, toast }
