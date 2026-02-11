
import { useAuthStore } from "@/store/authStore"
import { Navigate, Outlet } from "react-router-dom"

export function AuthLayout() {
  const { token } = useAuthStore()
  
  if (token) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-black text-white relative flex items-center justify-center p-4">
       {/* Background Elements */}
       <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
       <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>
       
       <Outlet />
    </div>
  )
}
