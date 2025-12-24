// src/pages/QuickAdd.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import toast, { Toaster } from "react-hot-toast";
import Header from "../components/Header";

/* Small helper to fetch categories & sources */
async function fetchLookups() {
  const [catsRes, srcsRes] = await Promise.allSettled([api.get("/categories"), api.get("/sources")]);
  const categories = catsRes.status === "fulfilled" ? (catsRes.value.data || []) : [];
  const sources = srcsRes.status === "fulfilled" ? (srcsRes.value.data || []) : [];
  return { categories, sources };
}

/* Add Income form component */
function AddIncome({ onDone }) {
  const [sourceId, setSourceId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState([]);

  useEffect(() => {
    fetchLookups().then(({ sources }) => setSources(sources || []));
  }, []);

  async function submit(e) {
    e?.preventDefault?.();
    if (!amount || !sourceId) { toast.error("amount and source_id required"); return; }
    setLoading(true);
    try {
      const payload = { source_id: sourceId, amount: Number(amount), description, date };
      await api.post("/incomes", payload);
      toast.success("Income added");
      window.dispatchEvent(new CustomEvent("data-updated"));
      setAmount(""); setDescription("");
      onDone?.();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to add income");
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="quickadd-form-area">
      <label className="label">Source</label>
      <select className="input" value={sourceId} onChange={e=>setSourceId(e.target.value)}>
        <option value="">Select source</option>
        {sources.map(s => <option key={s._id || s.id || s.name} value={s._id || s.id || s.name}>{s.name || s.title || s}</option>)}
      </select>

      <label className="label">Amount</label>
      <input className="input" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Amount" type="number" />

      <label className="label">Description</label>
      <input className="input" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Title/Description (optional)" />

      <label className="label">Date</label>
      <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} />

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button className="btn" type="submit" disabled={loading}>{loading ? "Adding..." : "Add"}</button>
      </div>
    </form>
  );
}

/* Add Expense form component */
function AddExpense({ onDone }) {
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchLookups().then(({ categories }) => setCategories(categories || []));
  }, []);

  async function submit(e) {
    e?.preventDefault?.();
    if (!amount || !categoryId) { toast.error("amount, category_id and date required"); return; }
    setLoading(true);
    try {
      // Optional: check balance before adding expense — fetch balance quickly
      const balRes = await api.get("/balance"); // if you have such endpoint; otherwise skip
      const balance = balRes?.data?.balance;
      if (typeof balance === "number" && balance - Number(amount) < 0) {
        toast.error("Insufficient balance");
        setLoading(false);
        return;
      }
    } catch (e) { /* ignore if endpoint not present */ }

    try {
      const payload = { category_id: categoryId, amount: Number(amount), description, date };
      await api.post("/expenses", payload);
      toast.success("Expense added");
      window.dispatchEvent(new CustomEvent("data-updated"));
      setAmount(""); setDescription("");
      onDone?.();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to add expense");
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="quickadd-form-area">
      <label className="label">Category</label>
      <select className="input" value={categoryId} onChange={e=>setCategoryId(e.target.value)}>
        <option value="">Select category</option>
        {categories.map(c => <option key={c._id || c.id || c.name} value={c._id || c.id || c.name}>{c.name || c.title || c}</option>)}
      </select>

      <label className="label">Amount</label>
      <input className="input" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Amount" type="number" />

      <label className="label">Description</label>
      <input className="input" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Title/Description (optional)" />

      <label className="label">Date</label>
      <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} />

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button className="btn" type="submit" disabled={loading}>{loading ? "Adding..." : "Add"}</button>
      </div>
    </form>
  );
}

/* Add Category form */
function AddCategory({ onDone }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e) {
    e?.preventDefault?.();
    if (!name) { toast.error("Category name required"); return; }
    setLoading(true);
    try {
      await api.post("/categories", { name });
      toast.success("Category added");
      window.dispatchEvent(new CustomEvent("data-updated"));
      setName("");
      onDone?.();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to add category");
    } finally { setLoading(false); }
  }
  return (
    <form onSubmit={submit} className="quickadd-form-area">
      <label className="label">Category name</label>
      <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Category title" />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button className="btn" type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</button>
      </div>
    </form>
  );
}

/* Add Source form */
function AddSource({ onDone }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e) {
    e?.preventDefault?.();
    if (!name) { toast.error("Source name required"); return; }
    setLoading(true);
    try {
      await api.post("/sources", { name });
      toast.success("Source added");
      window.dispatchEvent(new CustomEvent("data-updated"));
      setName("");
      onDone?.();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to add source");
    } finally { setLoading(false); }
  }
  return (
    <form onSubmit={submit} className="quickadd-form-area">
      <label className="label">Source name</label>
      <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Source title" />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button className="btn" type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</button>
      </div>
    </form>
  );
}

/* Set Budget form */
function SetBudget({ onDone }) {
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0,10));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth()+1); return d.toISOString().slice(0,10);
  });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchLookups().then(({ categories }) => setCategories(categories || []));
  }, []);

  async function submit(e) {
    e?.preventDefault?.();
    if (!amount || !categoryId || !startDate || !endDate) { toast.error("amount, start_date, end_date required"); return; }
    setLoading(true);
    try {
      const payload = { category_id: categoryId, amount: Number(amount), start_date: startDate, end_date: endDate };
      await api.post("/budgets", payload);
      toast.success("Budget saved");
      window.dispatchEvent(new CustomEvent("data-updated"));
      setAmount("");
      onDone?.();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to save budget");
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="quickadd-form-area">
      <label className="label">Set Budget for Category</label>
      <select className="input" value={categoryId} onChange={e=>setCategoryId(e.target.value)}>
        <option value="">Select category</option>
        {categories.map(c => <option key={c._id || c.id || c.name} value={c._id || c.id || c.name}>{c.name || c.title || c}</option>)}
      </select>

      <label className="label">Amount</label>
      <input className="input" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Amount" type="number" />

      <label className="label">Start date</label>
      <input className="input" type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} />

      <label className="label">End date</label>
      <input className="input" type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} />

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button className="btn" type="submit" disabled={loading}>{loading ? "Saving..." : "Save Budget"}</button>
      </div>
    </form>
  );
}

/* QuickAdd main page */
export default function QuickAdd() {
  const [active, setActive] = useState("income");

  const tabs = useMemo(() => ([
    { id: "income", label: "Income" },
    { id: "expense", label: "Expense" },
    { id: "category", label: "Add Category" },
    { id: "source", label: "Add Source" },
    { id: "budget", label: "Add Budget" }
  ]), []);

  return (
    <>
      <Header />
      <div className="page-content quickadd-page container">
        <Toaster position="top-right" />
        <div className="quickadd-grid" style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 28 }}>
          <div className="quickadd-left">
            <div className="card quickadd-card">
              <div className="card-head">
                <h3>Quick Add</h3>
                <p className="small muted">Add income, expense, category, source or budget</p>
              </div>

              <div className="tabs-row" style={{ marginBottom: 12 }}>
                {tabs.map(t => (
                  <div
                    key={t.id}
                    role="button"
                    className={`tab ${active === t.id ? "active" : ""}`}
                    onClick={() => setActive(t.id)}
                    style={{ cursor: "pointer" }}
                  >
                    {t.label}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 6 }}>
                {active === "income" && <AddIncome onDone={() => { /* optionally switch tab */ }} />}
                {active === "expense" && <AddExpense onDone={() => { /* switch or reset */ }} />}
                {active === "category" && <AddCategory onDone={() => setActive("income")} />}
                {active === "source" && <AddSource onDone={() => setActive("income")} />}
                {active === "budget" && <SetBudget onDone={() => setActive("income")} />}
              </div>
            </div>
          </div>

          <div className="quickadd-right">
            <div className="card">
              <h3>Quick Add</h3>
              <p className="small muted">Use the left panel to quickly create incomes, expenses, or add categories/sources. Dashboard & Reports refresh automatically.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
