import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './components/ui/use-toast.jsx'
import { ContractProvider } from './context/ContractContext.jsx'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <ContractProvider>
         <App />
      </ContractProvider>
    </ToastProvider>
  </StrictMode>,
)
