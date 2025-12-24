// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import toast from "react-hot-toast";
import Header from "../components/Header";

/* Small progress bar component */
function ProgressBar({ pct = 0 }) {
  const safe = Math.max(0, Math.min(100, Number(pct) || 0));
  return (
    <div className="progress-track" aria-hidden style={{ height: 8, borderRadius: 8 }}>
      <div className="progress-fill" style={{ width: `${safe}%`, height: "100%" }} />
    </div>
  );
}

/* Simple Edit modal (kept inside same file for convenience) */
function EditModal({ tx, onClose, onSave }) {
  const [amount, setAmount] = useState(tx?.amount ?? "");
  const [description, setDescription] = useState(tx?.description ?? "");
  const [date, setDate] = useState((tx?.date || tx?.createdAt || "").slice(0, 10) || new Date().toISOString().slice(0,10));
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    setAmount(tx?.amount ?? "");
    setDescription(tx?.description ?? "");
    setDate((tx?.date || tx?.createdAt || "").slice(0, 10) || new Date().toISOString().slice(0,10));
  }, [tx]);

  async function handleSave(e) {
    e.preventDefault();
    if (!tx) return;
    if (!amount || Number.isNaN(Number(amount))) {
      toast.error("Please enter a valid amount");
      return;
    }
    setLoading(true);
    try {
      const id = tx._id || tx.id;
      const endpointBase = tx.type === "income" ? "/incomes" : "/expenses";
      const payload = {
        amount: Number(amount),
        description: description || "",
        date: date
      };
      await api.put(`${endpointBase}/${id}`, payload);
      toast.success("Transaction updated");
      onSave({ ...tx, ...payload });
    } catch (err) {
      console.error("Update error", err);
      const msg = err?.response?.data?.message || "Failed to update";
      toast.error(String(msg));
    } finally {
      setLoading(false);
    }
  }

  if (!tx) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.35)", zIndex: 3000
    }}>
      <form className="card" style={{ width: 420 }} onSubmit={handleSave}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>{tx.type === "income" ? "Edit Income" : "Edit Expense"}</h3>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>

        <div style={{ marginTop: 12 }}>
          <label className="label">Amount</label>
          <input className="input" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" />
        </div>

        <div style={{ marginTop: 10 }}>
          <label className="label">Description</label>
          <input className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Title / description" />
        </div>

        <div style={{ marginTop: 10 }}>
          <label className="label">Date</label>
          <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn" type="submit" disabled={loading}>{loading ? "Saving..." : "Save changes"}</button>
        </div>
      </form>
    </div>
  );
}

export default function Dashboard() {
  const [balance, setBalance] = useState(0);
  const [budgets, setBudgets] = useState([]);
  const [recent, setRecent] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(false);

  // modal state
  const [editingTx, setEditingTx] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // helper to round small float errors
  const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

  async function fetchData() {
    setLoading(true);
    try {
      // fetch incomes, expenses, budgets
      const [incRes, expRes, budRes] = await Promise.all([
        api.get("/incomes"),
        api.get("/expenses"),
        api.get("/budgets"),
      ]);

      const incomes = Array.isArray(incRes.data) ? incRes.data : (incRes.data || []);
      const expenses = Array.isArray(expRes.data) ? expRes.data : (expRes.data || []);
      const budgetsData = Array.isArray(budRes.data) ? budRes.data : (budRes.data || []);

      // compute totals exactly
      const totalIn = incomes.reduce((s, i) => s + Number(i.amount || 0), 0);
      const totalEx = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
      const computedBalance = round2(totalIn - totalEx);
      setBalance(computedBalance);

      // build spentByCat map using normalized id keys (string)
      const spentByCat = {};
      expenses.forEach(e => {
        const idRaw = e.category?._id || e.category || e.category_id || e.categoryName || "uncat";
        const id = idRaw ? String(idRaw) : "uncat";
        spentByCat[id] = (spentByCat[id] || 0) + Number(e.amount || 0);
      });

      // normalize budgets for display
      const budgetsMapped = (budgetsData || []).map(b => {
        let catId = b.category?._id || b.category || b.category_id || b.name || b.categoryName || null;
        catId = catId ? String(catId) : `budget-${Math.random()}`;
        let catName = (b.category && (b.category.name || b.category.title)) || b.categoryName || b.name || "Uncategorized";
        const amount = Number(b.amount || 0);
        const spent = Number(spentByCat[String(catId)] || 0);
        const pct = amount > 0 ? Math.round((spent / amount) * 100) : 0;
        return { id: String(catId), name: catName, amount, spent, pct };
      });
      setBudgets(budgetsMapped);

      // combined list for recent & trend
      const combined = [
        ...(incomes || []).map(i => ({ ...i, type: "income" })),
        ...(expenses || []).map(e => ({ ...e, type: "expense" })),
      ];

      // sort newest first (date or createdAt)
      combined.sort((a, b) => {
        const da = new Date(a.date || a.createdAt || 0).getTime();
        const db = new Date(b.date || b.createdAt || 0).getTime();
        return db - da;
      });

      setRecent(combined.slice(0, 12));

      // build 14-day trend
      const days = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        days[key] = { date: key, net: 0 };
      }
      combined.forEach(tx => {
        const date = (tx.date || tx.createdAt || "").slice(0, 10);
        if (date && days[date]) days[date].net += tx.type === "income" ? Number(tx.amount || 0) : -Number(tx.amount || 0);
      });
      setTrend(Object.values(days));

    } catch (err) {
      console.error("Dashboard fetch error", err);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    const onUpdate = () => fetchData();
    window.addEventListener("data-updated", onUpdate);
    return () => window.removeEventListener("data-updated", onUpdate);
    // eslint-disable-next-line
  }, []);

  // Delete handler (works for incomes/expenses)
  async function handleDelete(tx) {
    if (!tx) return;
    const ok = window.confirm(`Delete this ${tx.type}? This action cannot be undone.`);
    if (!ok) return;
    try {
      const id = tx._id || tx.id;
      if (!id) throw new Error("Missing id for delete request");
      const endpointBase = tx.type === "income" ? "/incomes" : "/expenses";
      await api.delete(`${endpointBase}/${id}`);
      toast.success("Deleted");
      window.dispatchEvent(new Event("data-updated"));
      fetchData();
    } catch (err) {
      console.error("Delete error", err);
      toast.error(err?.response?.data?.message || err.message || "Failed to delete");
    }
  }

  // Open edit modal
  function openEdit(tx) {
    setEditingTx(tx);
    setModalOpen(true);
  }

  // Called after successful save in modal
  function onEditSaved(newTx) {
    setModalOpen(false);
    setEditingTx(null);
    toast.success("Updated");
    window.dispatchEvent(new Event("data-updated"));
    fetchData();
  }

  return (
    <div style={{ minHeight: "100vh", background: "transparent" }}>
      <Header />
      <div className="container" style={{ paddingTop: 28 }}>
        <div className="cards-grid" style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 22, alignItems: "start" }}>
          {/* LEFT - Top balance & recent */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div className="card balance-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div>
                  <div className="small muted">Remaining Balance</div>
                  <div className="balance-amount" style={{ fontSize: 30, fontWeight: 800, marginTop: 6 }}>
                    {Number(balance || 0).toLocaleString()}
                  </div>

                  {Number(balance) <= 0 && (
                    <div style={{ marginTop: 12, color: "#b91c1c", fontWeight: 600 }}>
                      Insufficient funds —<br />
                      please add income or reduce expenses
                    </div>
                  )}

                  <div className="small muted" style={{ marginTop: 12 }}>
                    Total income minus expenses
                  </div>
                </div>

                <div style={{ width: 220, height: 70 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trend}>
                      <defs>
                        <linearGradient id="tg" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area dataKey="net" stroke="#10b981" fill="url(#tg)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent transactions */}
            <div className="card recent-card">
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Recent Transactions</div>
                <div className="small muted">Latest income & expenses</div>
              </div>

              {/* table uses fixed layout so columns are evenly spaced */}
              <table
                className="table compact"
                style={{ width: "100%", tableLayout: "fixed", marginTop: 6 }}
              >
                <thead>
                  <tr>
                    <th style={{ width: "25%" }}>Date</th>
                    <th style={{ width: "25%" }}>Title</th>
                    <th style={{ width: "25%", textAlign: "right" }}>Amount</th>
                    <th style={{ width: "25%", textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.length === 0 && (
                    <tr>
                      <td colSpan={4} className="small muted">No recent transactions.</td>
                    </tr>
                  )}
                  {recent.map((r, idx) => (
                    <tr key={idx}>
                      <td style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(r.date || r.createdAt || "").slice(0, 10)}</td>

                      {/* Title cell: prevent long text from pushing layout */}
                      <td style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.description || (r.type === "income" ? "Income" : "Expense")}
                      </td>

                      <td style={{ textAlign: "right", color: r.type === "income" ? "#059669" : "#ef4444" }}>
                        {(r.type === "income" ? "+" : "-")}{Number(r.amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button className="btn btn-ghost" onClick={() => openEdit(r)} style={{ marginRight: 6 }}>Edit</button>
                        <button className="btn btn-danger" onClick={() => handleDelete(r)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div className="card short-card">
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Budget Usage</div>
                <div className="small muted">Monthly overview</div>
              </div>

              <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                {budgets.length === 0 ? (
                  <div className="small muted">No budgets found. Add budgets to track usage.</div>
                ) : (
                  budgets.slice(0, 4).map((b) => (
                    <div key={b.id} style={{ display: "grid", gap: 6 }}>
                      <div style={{ fontWeight: 700 }}>{b.name}</div>
                      <div className="small muted" style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>{b.spent.toLocaleString()}</span>
                        <span>{b.amount.toLocaleString()}</span>
                      </div>
                      <ProgressBar pct={b.pct} />
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card shortcuts-card">
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Shortcuts</div>
                <div className="small muted">Fast actions</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Link to="/quick-add"><button className="btn btn-secondary full">Quick Add Transaction</button></Link>
                <Link to="/reports"><button className="btn full">Open Reports</button></Link>
                <button className="btn light full" onClick={fetchData} disabled={loading}>{loading ? "Refreshing..." : "Refresh"}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* edit modal */}
      {modalOpen && <EditModal tx={editingTx} onClose={() => setModalOpen(false)} onSave={onEditSaved} />}
    </div>
  );
}
