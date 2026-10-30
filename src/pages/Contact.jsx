import { Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import ErrorMessage from "../components/ErrorMessage";
import FormInput from "../components/FormInput";
import { contactService } from "../services";
import { parseApiError } from "../utils/format";

const EMPTY = { name: "", email: "", subject: "", message: "" };

export default function Contact() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const local = {};
    if (form.name.trim().length < 2) local.name = "Please enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) local.email = "Enter a valid email address.";
    if (form.subject.trim().length < 3) local.subject = "Please add a subject.";
    if (form.message.trim().length < 10) local.message = "Your message should be at least 10 characters.";
    setErrors(local); setMessage(""); setSent("");
    if (Object.keys(local).length) return;
    setBusy(true);
    try {
      const res = await contactService.send(form);
      setSent(res.detail); setForm(EMPTY);
    } catch (err) {
      const r = parseApiError(err); setErrors(r.fields); setMessage(r.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="page">
      <div className="container">
        <h1 className="page-title">Contact us</h1>
        <div className="contact-grid">
          <div>
            <p className="muted">Questions about sizing, an order or anything else? Send us a message and we'll get back to you.</p>
            <div className="info-row"><MapPin /><div><strong>Visit</strong><br />24 Market Street, Your City</div></div>
            <div className="info-row"><Phone /><div><strong>Call</strong><br />+1 (555) 010-2030</div></div>
            <div className="info-row"><Mail /><div><strong>Email</strong><br />hello@stepup.example</div></div>
          </div>
          <form className="card" onSubmit={submit} noValidate>
            {sent && <div className="alert alert--success" role="status">{sent}</div>}
            <ErrorMessage message={message} />
            <div className="form-grid">
              <FormInput label="Name" required value={form.name} error={errors.name} onChange={set("name")} />
              <FormInput label="Email" type="email" required value={form.email} error={errors.email} onChange={set("email")} />
              <FormInput label="Subject" required className="span-2" value={form.subject} error={errors.subject} onChange={set("subject")} />
              <FormInput label="Message" as="textarea" required className="span-2" maxLength={3000} value={form.message} error={errors.message} onChange={set("message")} />
            </div>
            <button className="btn btn--primary" disabled={busy}>{busy ? "Sending..." : "Send message"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
