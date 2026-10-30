import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage";
import FormInput from "../components/FormInput";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { parseApiError } from "../utils/format";

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const from = location.state?.from || "/";
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (isAuthenticated && !busy) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    const local = {};
    if (!form.first_name.trim()) local.first_name = "Enter your first name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) local.email = "Enter a valid email address.";
    if (form.phone && !/^\+?[0-9 ()\-]{7,20}$/.test(form.phone)) local.phone = "Enter a valid phone number.";
    if (form.password.length < 8) local.password = "Use at least 8 characters.";
    if (form.confirm !== form.password) local.confirm = "Passwords do not match.";
    setErrors(local); setMessage("");
    if (Object.keys(local).length) return;
    setBusy(true);
    try {
      const { confirm, ...payload } = form;
      await register(payload);
      toast.success("Account created. Welcome to StepUp!");
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
          <h1>Create your account</h1>
          <p className="muted">It takes less than a minute.</p>
          <ErrorMessage message={message} />
          <form onSubmit={submit} noValidate>
            <div className="form-grid">
              <FormInput label="First name" required autoComplete="given-name" value={form.first_name} error={errors.first_name} onChange={set("first_name")} />
              <FormInput label="Last name" autoComplete="family-name" value={form.last_name} error={errors.last_name} onChange={set("last_name")} />
            </div>
            <FormInput label="Email" type="email" required autoComplete="email" value={form.email} error={errors.email} onChange={set("email")} />
            <FormInput label="Phone (optional)" type="tel" autoComplete="tel" value={form.phone} error={errors.phone} onChange={set("phone")} />
            <FormInput label="Password" type="password" required autoComplete="new-password" hint="At least 8 characters; avoid common passwords." value={form.password} error={errors.password} onChange={set("password")} />
            <FormInput label="Confirm password" type="password" required autoComplete="new-password" value={form.confirm} error={errors.confirm} onChange={set("confirm")} />
            <button className="btn btn--primary btn--block" disabled={busy}>{busy ? "Creating account..." : "Create account"}</button>
          </form>
          <p className="auth__switch">Already have an account? <Link to="/login" state={{ from }}>Log in</Link></p>
        </div>
      </div>
    </div>
  );
}
