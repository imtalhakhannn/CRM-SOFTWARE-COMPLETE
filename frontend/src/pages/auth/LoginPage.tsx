import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { authApi } from "@/api/endpoints";
import { useAuthStore } from "@/store/auth";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@crm.io");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      login(res.access_token, res.user);
      toast.success(`Welcome back, ${res.user.full_name.split(" ")[0]} 👋`);
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-brand relative overflow-hidden items-center justify-center p-12 text-white">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-pink-400/20 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Sparkles size={26} />
            </div>
            <div>
              <div className="text-2xl font-bold">CRM Pro</div>
              <div className="text-xs text-white/70 uppercase tracking-wider">Professional Suite</div>
            </div>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Manage your pipeline<br/> with <span className="text-pink-200">confidence</span>.
          </h1>
          <p className="text-white/80 leading-relaxed">
            Track leads, applications, invoices, teams and campaigns in one beautiful workspace.
            Built for education agents, visa consultants and professional services.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-10">
            {[
              ["17+", "Modules"],
              ["∞", "Contacts"],
              ["24/7", "Access"],
            ].map(([v, l]) => (
              <div key={l}>
                <div className="text-3xl font-bold">{v}</div>
                <div className="text-xs text-white/70">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <form onSubmit={submit} className="card w-full max-w-md p-8 shadow-pop">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-lg bg-gradient-brand flex items-center justify-center shadow">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">CRM Pro</h1>
              <p className="text-xs text-slate-500">Sign in to continue</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-1">Welcome back 👋</h2>
          <p className="text-sm text-slate-500 mb-6">Enter your credentials to access your workspace</p>

          <label className="label">Email address</label>
          <input className="input mb-4" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

          <label className="label">Password</label>
          <input className="input mb-6" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

          <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
            {loading ? "Signing in..." : "Sign in to Dashboard"}
          </button>

          <div className="mt-6 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <div className="font-semibold text-slate-700 mb-1">Demo credentials</div>
            <div>Admin · <code>admin@crm.io</code> / <code>admin123</code></div>
            <div>Consultant · <code>consultant@crm.io</code> / <code>consultant123</code></div>
          </div>
        </form>
      </div>
    </div>
  );
}
