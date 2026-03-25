import { useState } from "react";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    let err = {};
    if (!form.email.includes("@")) err.email = "Enter valid email";
    if (form.password.length < 6)
      err.password = "Password must be 6+ chars";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      console.log("Login success", form);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500">

      <div className="backdrop-blur-lg bg-white/10 p-8 rounded-2xl shadow-2xl w-87.5 text-white">
        <h2 className="text-2xl font-bold text-center mb-6">
          Welcome Back 👋
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Email */}
          <div className="relative">
            <input
              type="text"
              required
              className="w-full p-3 rounded-lg bg-white/20 outline-none focus:ring-2 focus:ring-pink-400 peer"
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />
            <label className="absolute left-3 top-3 text-sm transition-all peer-focus:-top-2 peer-focus:text-xs peer-valid:-top-2">
              Email
            </label>
            {errors.email && (
              <p className="text-red-400 text-xs">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              required
              className="w-full p-3 rounded-lg bg-white/20 outline-none focus:ring-2 focus:ring-pink-400"
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />
            <button
              type="button"
              className="absolute right-3 top-3 text-sm"
              onClick={() => setShow(!show)}
            >
              {show ? "Hide" : "Show"}
            </button>
            {errors.password && (
              <p className="text-red-400 text-xs">
                {errors.password}
              </p>
            )}
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full p-3 rounded-lg bg-pink-500 hover:bg-pink-600 transition"
          >
            Login
          </button>

          {/* Extra */}
          <p className="text-center text-sm">
            Don’t have an account?{" "}
            <span className="underline cursor-pointer">
              Sign up
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}