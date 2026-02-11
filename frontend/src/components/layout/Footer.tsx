
import { Zap, Github, Twitter, Linkedin, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black pt-16 pb-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                <Zap className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                SCOUT<span className="text-cyan-400">IQ</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              The autonomous market intelligence platform for forward-thinking enterprises. Dominate your market with real-time AI insights.
            </p>
            <div className="flex gap-4">
              <SocialIcon icon={<Twitter className="w-4 h-4" />} />
              <SocialIcon icon={<Github className="w-4 h-4" />} />
              <SocialIcon icon={<Linkedin className="w-4 h-4" />} />
              <SocialIcon icon={<Mail className="w-4 h-4" />} />
            </div>
          </div>

          {/* Links Column 1 */}
          <div>
            <h4 className="font-bold text-white mb-6">Product</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <FooterLink>Features</FooterLink>
              <FooterLink>Integrations</FooterLink>
              <FooterLink>Enterprise</FooterLink>
              <FooterLink>Changelog</FooterLink>
              <FooterLink>Documentation</FooterLink>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h4 className="font-bold text-white mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <FooterLink>About Us</FooterLink>
              <FooterLink>Careers</FooterLink>
              <FooterLink>Blog</FooterLink>
              <FooterLink>Legal</FooterLink>
              <FooterLink>Contact</FooterLink>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div>
            <h4 className="font-bold text-white mb-6">Stay Ahead</h4>
            <p className="text-gray-400 text-sm mb-4">
              Subscribe to our intelligence briefing. No spam, just insights.
            </p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-white/5 border border-white/10 rounded-md px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 w-full transition-colors"
              />
              <Button variant="neon" size="icon" className="shrink-0">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© 2026 ScoutIQ Inc. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">Cookie Settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ icon }: { icon: React.ReactNode }) {
  return (
    <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all duration-300 border border-transparent hover:border-cyan-500/20">
      {icon}
    </a>
  )
}

function FooterLink({ children }: { children: React.ReactNode }) {
  return (
    <li>
      <a href="#" className="hover:text-cyan-400 transition-colors block w-fit">
        {children}
      </a>
    </li>
  )
}
