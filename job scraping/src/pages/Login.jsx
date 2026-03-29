import { useState } from "react";
import { Mail, Lock, Loader2, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function Login({ onAuthenticated }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const navigate = useNavigate();

  const validate = () => {
    let err = {};
    if (!form.email.includes("@")) err.email = "Enter valid email";
    if (form.password.length < 6)
      err.password = "Password must be 6+ chars";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    
    if (validate()) {
      setIsLoading(true);
      try {
        const res = await fetch('http://localhost:8000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        
        if (onAuthenticated) {
          onAuthenticated(data.token);
        }
        navigate("/dashboard");
      } catch (err) {
        setApiError(err.message || 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
      <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4">
            <Sparkles size={28} className="text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-slate-400 text-sm">Sign in to access your AI Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {apiError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {apiError}
            </div>
          )}

          <div className="relative">
            <Mail size={18} className="absolute left-4 top-3.5 text-slate-500" />
            <input
              type="text"
              className="w-full bg-slate-950/50 border border-slate-700 rounded-lg py-3 pl-11 pr-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Email Address"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {errors.email && <p className="text-red-400 text-xs mt-1 ml-1">{errors.email}</p>}
          </div>

          <div className="relative">
            <Lock size={18} className="absolute left-4 top-3.5 text-slate-500" />
            <input
              type={show ? "text" : "password"}
              className="w-full bg-slate-950/50 border border-slate-700 rounded-lg py-3 pl-11 pr-12 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Password"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              className="absolute right-4 top-3.5 text-sm text-slate-400 hover:text-white focus:outline-none"
              onClick={() => setShow(!show)}
            >
              {show ? "Hide" : "Show"}
            </button>
            {errors.password && <p className="text-red-400 text-xs mt-1 ml-1">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 mt-2 p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
          </button>

          <p className="text-center text-sm text-slate-400 mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-semibold">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}