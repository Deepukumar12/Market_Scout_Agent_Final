
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/Button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/Form"
import { Input } from "@/components/ui/Input"
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
        <Link to="/" className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-foreground text-background shadow-apple-large mb-8 transition-transform hover:scale-105 active:scale-95">
          <Zap className="w-8 h-8" />
        </Link>
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3">Sign in.</h1>
        <p className="text-sm font-medium text-muted-foreground">Use your ScoutIQ credentials.</p>
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
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <Input 
                       placeholder="Email Address" 
                       {...field} 
                       className="bg-card border-border text-foreground rounded-2xl h-14 pl-12 pr-5 font-medium transition-all focus:ring-4 focus:ring-primary/10 focus:border-primary" 
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
                     <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                     <Input 
                       type="password" 
                       placeholder="Access Key" 
                       {...field} 
                       className="bg-card border-border text-foreground rounded-2xl h-14 pl-12 pr-5 font-medium transition-all focus:ring-4 focus:ring-primary/10 focus:border-primary" 
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
              className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-bold uppercase tracking-tight italic flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
              {error}
            </motion.div>
          )}

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-[#0077ED] text-white rounded-full h-14 font-black text-[12px] uppercase tracking-widest shadow-lg shadow-[#0071E3]/20 transition-all active:scale-95" 
              disabled={loading}
            >
              {loading ? "Verifying..." : "Continue"}
            </Button>
          </div>
          
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black italic">
              <span className="bg-background px-4 text-muted-foreground">OR</span>
            </div>
          </div>

          <Button 
            type="button" 
            variant="ghost" 
            className="w-full text-foreground hover:bg-muted rounded-full h-14 font-bold text-sm"
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
        <p className="text-sm font-medium text-muted-foreground">
          New operator?{" "}
          <Link to="/register" className="text-primary hover:underline font-bold">
            Create Protocol.
          </Link>
        </p>
      </div>
    </div>
  )
}
