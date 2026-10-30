import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage";
import FormInput from "../components/FormInput";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { parseApiError } from "../utils/format";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const from = location.state?.from || "/";
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  if (isAuthenticated && !busy) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    const local = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) local.email = "Enter a valid email address.";
    if (!form.password) local.password = "Enter your password.";
    setErrors(local); setMessage("");
    if (Object.keys(local).length) return;
    setBusy(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.first_name || "friend"}!`);
      navigate(from, { replace: true });
    } catch (err) {
      const { message: m, fields } = parseApiError(err);
      setErrors(fields); setMessage(m);
      setBusy(false);
    }
  };

  return (
    <div className="page container">
      <div className="auth">
        <div className="card">
          <h1>Log in</h1>
          <p className="muted">Welcome back! Log in to checkout and view your orders.</p>
          <ErrorMessage message={message} />
          <form onSubmit={submit} noValidate>
            <FormInput label="Email" type="email" autoComplete="email" required value={form.email} error={errors.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <FormInput label="Password" type="password" autoComplete="current-password" required value={form.password} error={errors.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <button className="btn btn--primary btn--block" disabled={busy}>{busy ? "Logging in..." : "Log in"}</button>
          </form>
          <p className="auth__switch">New to StepUp? <Link to="/register" state={{ from }}>Create an account</Link></p>
        </div>
      </div>
    </div>
  );
}
