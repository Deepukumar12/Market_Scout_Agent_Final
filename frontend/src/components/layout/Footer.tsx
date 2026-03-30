
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
              <SocialIcon href="https://x.com/Deepukumar24" icon={<Twitter className="w-4 h-4" />} />
              <SocialIcon href="https://github.com/Deepukumar12" icon={<Github className="w-4 h-4" />} />
              <SocialIcon href="https://www.linkedin.com/in/deepu-kumar-393564289/" icon={<Linkedin className="w-4 h-4" />} />
              <SocialIcon href="mailto:deeputhakur0986@gmail.com" icon={<Mail className="w-4 h-4" />} />
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

          {/* Founder Column */}
          <div className="md:col-span-1 border-l border-white/10 pl-8">
            <h4 className="font-black text-white mb-6 uppercase tracking-[0.2em] text-[10px] italic flex items-center gap-2">
              <Zap className="w-3 h-3 text-cyan-400" /> Pioneering the <span className="text-cyan-400">Scout IQ</span> Era
            </h4>
            <div className="space-y-4">
              <p className="text-gray-400 text-xs leading-relaxed italic font-medium">
                "Our mission is to democratize high-fidelity market intelligence. By synthesizing millions of global technical signals, we empower organizations to move at the speed of thought."
              </p>
              <div className="flex items-center gap-3 pt-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black italic text-sm shadow-lg">
                  DK
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-black uppercase italic tracking-tighter text-sm">Deepu Kumar</span>
                  <span className="text-cyan-400 text-[9px] font-bold uppercase tracking-widest leading-none">Architect & Founder</span>
                </div>
              </div>
              <div className="pt-4 space-y-2 border-t border-white/5">
                <a href="mailto:deeputhakur0986@gmail.com" className="text-gray-400 hover:text-cyan-400 transition-colors text-xs flex items-center gap-2">
                  <Mail className="w-3 h-3" /> deeputhakur0986@gmail.com
                </a>
                <div className="text-gray-400 text-[10px] flex items-center gap-2 font-mono">
                  +91 9006225162
                </div>
              </div>
            </div>
          </div>

          {/* Stay Ahead Column */}
          <div>
            <h4 className="font-bold text-white mb-6">Connect</h4>
            <div className="flex gap-4 mb-8">
              <SocialIcon href="https://x.com/Deepukumar24" icon={<Twitter className="w-4 h-4" />} />
              <SocialIcon href="https://github.com/Deepukumar12" icon={<Github className="w-4 h-4" />} />
              <SocialIcon href="https://www.linkedin.com/in/deepu-kumar-393564289/" icon={<Linkedin className="w-4 h-4" />} />
              <SocialIcon href="mailto:deeputhakur0986@gmail.com" icon={<Mail className="w-4 h-4" />} />
            </div>
            <h4 className="font-bold text-white mb-6">Stay Ahead</h4>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Intelligence Stream" 
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
          <p>© 2026 ScoutIQ Inc. & Deepu Kumar. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-cyan-400 transition-colors">Neural Sovereignty</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">Signal Privacy</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">Founder Direct</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ icon, href }: { icon: React.ReactNode, href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all duration-300 border border-transparent hover:border-cyan-500/20">
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
