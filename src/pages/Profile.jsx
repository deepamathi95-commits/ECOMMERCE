import { Plus, Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage";
import FormInput from "../components/FormInput";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { authService } from "../services";
import { parseApiError } from "../utils/format";

const EMPTY = { label: "", full_name: "", phone: "", address_line: "", city: "", state: "", postal_code: "", country: "", is_default: false };

function DetailsTab() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ first_name: user.first_name, last_name: user.last_name, phone: user.phone || "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    const local = {};
    if (!form.first_name.trim()) local.first_name = "First name is required.";
    if (form.phone && !/^\+?[0-9 ()\-]{7,20}$/.test(form.phone)) local.phone = "Enter a valid phone number.";
    setErrors(local); setMessage("");
    if (Object.keys(local).length) return;
    setBusy(true);
    try { await updateProfile(form); toast.success("Profile updated."); }
    catch (err) { const r = parseApiError(err); setErrors(r.fields); setMessage(r.message); }
    finally { setBusy(false); }
  };

  return (
    <form className="card" onSubmit={save} noValidate style={{ maxWidth: 620 }}>
      <ErrorMessage message={message} />
      <div className="form-grid">
        <FormInput label="First name" required value={form.first_name} error={errors.first_name} onChange={set("first_name")} />
        <FormInput label="Last name" value={form.last_name} error={errors.last_name} onChange={set("last_name")} />
      </div>
      <FormInput label="Email" value={user.email} disabled hint="Your email is your login and can't be changed here." readOnly />
      <FormInput label="Phone" type="tel" value={form.phone} error={errors.phone} onChange={set("phone")} />
      <button className="btn btn--primary" disabled={busy}>{busy ? "Saving..." : "Save changes"}</button>
    </form>
  );
}

function AddressesTab() {
  const toast = useToast();
  const [list, setList] = useState(null);
  const [form, setForm] = useState(null); // null = hidden
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => authService.addresses().then(setList).catch((e) => setMessage(parseApiError(e).message));
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setErrors({}); setMessage("");
    try {
      form.id ? await authService.updateAddress(form.id, form) : await authService.addAddress(form);
      toast.success("Address saved.");
      setForm(null);
      await load();
    } catch (err) { const r = parseApiError(err); setErrors(r.fields); setMessage(r.message); }
    finally { setBusy(false); }
  };

  const remove = async (a) => {
    if (!window.confirm("Delete this address?")) return;
    try { await authService.deleteAddress(a.id); toast.success("Address deleted."); await load(); }
    catch (err) { toast.error(parseApiError(err).message); }
  };

  const makeDefault = async (a) => {
    try { await authService.updateAddress(a.id, { is_default: true }); await load(); }
    catch (err) { toast.error(parseApiError(err).message); }
  };

  if (!list) return message ? <ErrorMessage message={message} onRetry={load} /> : <LoadingSpinner />;

  return (
    <div>
      {!form && <button type="button" className="btn btn--primary btn--sm" onClick={() => { setForm({ ...EMPTY }); setErrors({}); }}><Plus size={16} /> Add address</button>}
      {form && (
        <form className="card" onSubmit={save} noValidate style={{ maxWidth: 680, marginBottom: "var(--space-5)" }}>
          <h2 style={{ fontSize: "var(--fs-lg)" }}>{form.id ? "Edit address" : "New address"}</h2>
          <ErrorMessage message={message} />
          <div className="form-grid">
            <FormInput label="Label (e.g. Home)" value={form.label} error={errors.label} onChange={set("label")} />
            <FormInput label="Full name" required value={form.full_name} error={errors.full_name} onChange={set("full_name")} />
            <FormInput label="Phone" type="tel" required value={form.phone} error={errors.phone} onChange={set("phone")} />
            <FormInput label="Country" required value={form.country} error={errors.country} onChange={set("country")} />
            <FormInput label="Street address" required className="span-2" value={form.address_line} error={errors.address_line} onChange={set("address_line")} />
            <FormInput label="City" required value={form.city} error={errors.city} onChange={set("city")} />
            <FormInput label="State / Province" required value={form.state} error={errors.state} onChange={set("state")} />
            <FormInput label="Postal code" required value={form.postal_code} error={errors.postal_code} onChange={set("postal_code")} />
          </div>
          <label style={{ display: "flex", gap: 8, marginBottom: 16 }}><input type="checkbox" checked={form.is_default} onChange={set("is_default")} /> Use as my default address</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn--primary" disabled={busy}>{busy ? "Saving..." : "Save address"}</button>
            <button type="button" className="btn btn--ghost" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </form>
      )}
      {list.length === 0 && !form && <p className="muted" style={{ marginTop: 16 }}>You haven't saved any addresses yet.</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginTop: 16 }}>
        {list.map((a) => (
          <div key={a.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <strong>{a.label || "Address"}</strong>
              {a.is_default && <span className="badge"><Star size={12} style={{ verticalAlign: -1 }} /> Default</span>}
            </div>
            <address style={{ fontStyle: "normal", margin: "8px 0 12px" }}>{a.full_name}<br />{a.address_line}<br />{a.city}, {a.state} {a.postal_code}<br />{a.country}<br /><span className="muted">{a.phone}</span></address>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="btn btn--outline btn--sm" onClick={() => { setForm(a); setErrors({}); }}>Edit</button>
              {!a.is_default && <button type="button" className="btn btn--ghost btn--sm" onClick={() => makeDefault(a)}>Make default</button>}
              <button type="button" className="link-danger" onClick={() => remove(a)}><Trash2 size={14} /> Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const [tab, setTab] = useState("details");
  return (
    <div className="page">
      <div className="container">
        <h1 className="page-title">Hello, {user.first_name || "there"}</h1>
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === "details"} onClick={() => setTab("details")}>My details</button>
          <button role="tab" aria-selected={tab === "addresses"} onClick={() => setTab("addresses")}>Shipping addresses</button>
          <Link to="/orders" style={{ padding: "12px 18px", fontWeight: 700, color: "var(--color-muted)" }}>Order history →</Link>
        </div>
        {tab === "details" ? <DetailsTab /> : <AddressesTab />}
      </div>
    </div>
  );
}
