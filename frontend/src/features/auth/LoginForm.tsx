
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { loginSchema, LoginSchema } from "./schemas"
import { useAuthStore } from "@/store/authStore"
import { motion } from "framer-motion"
import { Zap, User, Key } from "lucide-react"

export function LoginForm() {
  const navigate = useNavigate()
  const { login, loading, error } = useAuthStore()
  
  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: LoginSchema) {
    await login(values.email, values.password)
    if (!useAuthStore.getState().error) {
       navigate("/dashboard")
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Apple-style Logo Header */}
      <div className="text-center mb-12">
        <Link to="/" className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1D1D1F] text-white shadow-apple-large mb-8 transition-transform hover:scale-105 active:scale-95">
          <Zap className="w-8 h-8" />
        </Link>
        <h1 className="text-4xl font-bold tracking-tight text-[#1D1D1F] mb-3">Sign in.</h1>
        <p className="text-sm font-medium text-[#6E6E73]">Use your ScoutIQ credentials.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                   <div className="relative group">
                     <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B] dark:text-[#A1A1A6] transition-colors group-focus-within:text-[#0071E3]" />
                     <Input 
                      placeholder="Email Address" 
                      {...field} 
                      className="bg-white border-[#E5E5EA] text-[#1D1D1F] rounded-2xl h-14 pl-12 pr-5 font-medium transition-all focus:ring-4 focus:ring-[#0071E3]/10 focus:border-[#0071E3]" 
                    />
                   </div>
                </FormControl>
                <FormMessage className="text-[10px] font-bold text-rose-500 mt-2 ml-2" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <div className="relative group">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B] dark:text-[#A1A1A6] transition-colors group-focus-within:text-[#0071E3]" />
                    <Input 
                      type="password" 
                      placeholder="Access Key" 
                      {...field} 
                      className="bg-white border-[#E5E5EA] text-[#1D1D1F] rounded-2xl h-14 pl-12 pr-5 font-medium transition-all focus:ring-4 focus:ring-[#0071E3]/10 focus:border-[#0071E3]" 
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-[10px] font-bold text-rose-500 mt-2 ml-2" />
              </FormItem>
            )}
          />
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-bold uppercase tracking-tight italic flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              {error}
            </motion.div>
          )}

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full h-14 font-black text-[12px] uppercase tracking-widest shadow-lg shadow-[#0071E3]/20 transition-all active:scale-95" 
              disabled={loading}
            >
              {loading ? "Verifying..." : "Continue"}
            </Button>
          </div>
          
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#E5E5EA]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black italic">
              <span className="bg-[#F5F5F7] px-4 text-[#86868B]">OR</span>
            </div>
          </div>

          <Button 
            type="button" 
            variant="ghost" 
            className="w-full text-[#1D1D1F] hover:bg-white rounded-full h-14 font-bold text-sm"
            onClick={() => {
                form.setValue("email", "demo@scoutiq.ai");
                form.setValue("password", "demo123");
                form.handleSubmit(onSubmit)();
            }}
            disabled={loading}
          >
            Launch Demo Console
          </Button>
        </form>
      </Form>
      
      <div className="mt-12 text-center">
        <p className="text-sm font-medium text-[#6E6E73]">
          New operator?{" "}
          <Link to="/register" className="text-[#0071E3] hover:underline font-bold">
            Create Protocol.
          </Link>
        </p>
      </div>
    </div>
  )
}
