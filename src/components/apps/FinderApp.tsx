import React, { useEffect, useRef, useState } from 'react';
import { User, Briefcase, Award, Mail, Calendar, Send } from 'lucide-react';
import confetti from 'canvas-confetti';

interface FinderTab {
  id: string;
  name: string;
  icon: React.ReactNode;
}

export const FinderApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('about');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const contactResetTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (contactResetTimeoutRef.current !== null) {
        window.clearTimeout(contactResetTimeoutRef.current);
      }
    };
  }, []);

  const tabs: FinderTab[] = [
    { id: 'about', name: 'About Me', icon: <User className="w-4 h-4 text-sky-500" /> },
    { id: 'experience', name: 'Experience', icon: <Briefcase className="w-4 h-4 text-emerald-500" /> },
    { id: 'skills', name: 'Skills & Tech', icon: <Award className="w-4 h-4 text-amber-500" /> },
    { id: 'contact', name: 'Contact Me', icon: <Mail className="w-4 h-4 text-rose-500" /> },
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMsg) return;

    setFormSubmitted(true);
    // Success feedback: trigger a splash of confetti!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Reset form after delay
    if (contactResetTimeoutRef.current !== null) {
      window.clearTimeout(contactResetTimeoutRef.current);
    }

    contactResetTimeoutRef.current = window.setTimeout(() => {
      contactResetTimeoutRef.current = null;
      setContactName('');
      setContactEmail('');
      setContactMsg('');
      setFormSubmitted(false);
    }, 3000);
  };

  return (
    <div className="finder-app flex h-full w-full bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 select-none">
      {/* Finder Sidebar */}
      <div className="finder-sidebar w-44 border-r border-slate-200 dark:border-zinc-800 bg-slate-100/50 dark:bg-zinc-900/30 p-2.5 flex flex-col gap-4 shrink-0">
        <div>
          <span className="finder-sidebar-label text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-2">
            Favorites
          </span>
          <div className="finder-tab-list flex flex-col gap-0.5 mt-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`finder-tab-button flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium w-full text-left transition-all ${
                  activeTab === tab.id
                    ? 'bg-slate-200/80 dark:bg-zinc-800/80 text-blue-600 dark:text-sky-400 font-semibold'
                    : 'hover:bg-slate-200/40 dark:hover:bg-zinc-800/40 text-slate-700 dark:text-zinc-300'
                }`}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Finder Details Pane */}
      <div className="finder-content flex-1 overflow-y-auto p-6 text-sm">
        {/* Render content based on activeTab */}
        {activeTab === 'about' && (
          <div className="flex flex-col gap-6 max-w-xl">
            {/* Header info */}
            <div className="flex items-center gap-5 border-b border-slate-200 dark:border-zinc-800 pb-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-md shrink-0">
                IU
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Ilgaz U.</h1>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Full-Stack Software Engineer</p>
                <div className="flex items-center gap-2.5 mt-2">
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 hover:text-blue-500 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-md transition-all text-slate-500"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                  </a>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 hover:text-blue-500 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-md transition-all text-slate-500"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Profile Bio */}
            <div className="flex flex-col gap-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Profile Summary</h2>
              <p className="text-slate-600 dark:text-zinc-300 leading-relaxed">
                Passionate Full Stack Software Engineer focused on crafting premium, state-of-the-art web experiences. I specialize in building highly responsive frontends with React, Vite, and animation engines (like GSAP or Framer Motion), coupled with scalable backends in Node.js and cloud technologies.
              </p>
              <p className="text-slate-600 dark:text-zinc-300 leading-relaxed">
                My workflow integrates solid software architectures, clean code conventions, and rich aesthetics, ensuring apps are not just functional but also visually striking.
              </p>
            </div>

            {/* Hobbies / Interests */}
            <div className="flex flex-col gap-2.5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Core Focus & Values</h2>
              <div className="flex flex-wrap gap-2">
                {['React Ecosystem', 'Animation & UI/UX', 'Micro-interactions', 'System Architecture', 'Clean Code', 'TypeScript'].map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 border border-sky-200/50 dark:border-sky-800/30 rounded-full text-xs font-semibold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'experience' && (
          <div className="flex flex-col gap-6 max-w-xl">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Work History</h1>
            
            <div className="flex flex-col gap-5 border-l-2 border-slate-200 dark:border-zinc-800 pl-5 ml-2.5 relative">
              {/* Timeline item 1 */}
              <div className="flex flex-col gap-1 relative">
                <div className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-50 dark:border-zinc-950" />
                <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Frontend Architect</h3>
                  <span className="text-xs text-blue-600 dark:text-sky-400 font-semibold flex items-center gap-1.5 mt-1 sm:mt-0">
                    <Calendar className="w-3.5 h-3.5" /> 2024 - Present
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Fintech Solutions Group</span>
                <p className="text-slate-600 dark:text-zinc-300 mt-2 leading-relaxed text-xs">
                  - Spearheaded migration of legacy dashboards to modern React + Vite layouts, achieving 40% faster render speeds.<br />
                  - Implemented reusable core UI layout system and high-performance interactive visual graphics.<br />
                  - Led a team of 4 frontend engineers setting high quality code metrics.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="flex flex-col gap-6 max-w-xl">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Technical Skillset</h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Frontend Category */}
              <div className="bg-slate-200/30 dark:bg-zinc-900/20 p-4 rounded-xl border border-slate-200/50 dark:border-zinc-800/50">
                <h3 className="font-bold text-slate-900 dark:text-white mb-3">Frontend Engineering</h3>
                <div className="flex flex-col gap-3">
                  {[
                    { name: 'React / Next.js', val: 95 },
                    { name: 'TypeScript', val: 90 },
                    { name: 'Tailwind CSS', val: 95 },
                    { name: 'GSAP / Animations', val: 85 },
                  ].map((s) => (
                    <div key={s.name} className="flex flex-col gap-1">
                      <div className="flex justify-between text-[11px] font-semibold">
                        <span>{s.name}</span>
                        <span>{s.val}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${s.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Backend & Tools Category */}
              <div className="bg-slate-200/30 dark:bg-zinc-900/20 p-4 rounded-xl border border-slate-200/50 dark:border-zinc-800/50">
                <h3 className="font-bold text-slate-900 dark:text-white mb-3">Backend & Infrastructure</h3>
                <div className="flex flex-col gap-3">
                  {[
                    { name: 'Node.js / Express', val: 88 },
                    { name: 'PostgreSQL / MongoDB', val: 85 },
                    { name: 'AWS / Cloud Deployment', val: 80 },
                    { name: 'Git & CI/CD Pipelines', val: 90 },
                  ].map((s) => (
                    <div key={s.name} className="flex flex-col gap-1">
                      <div className="flex justify-between text-[11px] font-semibold">
                        <span>{s.name}</span>
                        <span>{s.val}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${s.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="flex flex-col gap-5 max-w-md">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Get in Touch</h1>
            <p className="text-slate-500 dark:text-zinc-400 text-xs">
              Fill out the form below to send a message directly to my inbox!
            </p>

            {formSubmitted ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50 rounded-xl p-5 flex flex-col items-center gap-2 animate-pop-in">
                <Send className="w-8 h-8 text-emerald-500" />
                <span className="font-bold">Message Sent Successfully!</span>
                <span className="text-xs text-center opacity-80 mt-1">
                  Thank you for reaching out. I'll get back to you shortly!
                </span>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500">Name</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Enter your name"
                    className="px-3.5 py-2 text-xs bg-slate-200/50 dark:bg-zinc-900/50 border border-slate-300/40 dark:border-zinc-800/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500">Email Address</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="px-3.5 py-2 text-xs bg-slate-200/50 dark:bg-zinc-900/50 border border-slate-300/40 dark:border-zinc-800/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={contactMsg}
                    onChange={(e) => setContactMsg(e.target.value)}
                    placeholder="Type your message here..."
                    className="px-3.5 py-2 text-xs bg-slate-200/50 dark:bg-zinc-900/50 border border-slate-300/40 dark:border-zinc-800/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-2 w-full py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg text-xs transition-all shadow-md active:scale-98 flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
