import type { ToastContainerProps } from 'react-toastify'
import { ToastContainer as _ToastContainer } from 'react-toastify'

const toastOptions: ToastContainerProps = {
  autoClose: 3000,
  pauseOnHover: true,
  hideProgressBar: true,
  newestOnTop: true,
  closeOnClick: true,
  closeButton: false,
}

export const ToastContainer = () => {
  return <_ToastContainer {...toastOptions} />
}
