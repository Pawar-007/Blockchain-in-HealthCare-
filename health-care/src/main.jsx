import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './components/ui/use-toast.jsx'
import { ContractProvider } from './context/ContractContext.jsx'
import { MedicalRecordProvider } from './context/MedicalRecordContext.jsx'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <ContractProvider>
        <MedicalRecordProvider>
           <App />
        </MedicalRecordProvider>
      </ContractProvider>
    </ToastProvider>
  </StrictMode>,
)
