// src/components/AddBudgetForm.jsx
import React, { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function AddBudgetForm() {
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await api.get("/categories");
        if (!mounted) return;
        const data = res.data || [];
        setCategories(data);
        if (data.length && !categoryId) {
          // pick first category by default
          const first = data[0];
          // prefer id fields
          const id = first._id || first.id || first.name || "";
          setCategoryId(id);
        }
      } catch (err) {
        console.error("Failed to fetch categories", err);
        // don't error loudly; categories can be empty
      }
    }
    load();
    return () => { mounted = false; };
  }, []); // only once

  async function handleSubmit(e) {
    e.preventDefault();

    // validation
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Please set start and end dates");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Start date must be before end date");
      return;
    }
    if (!categoryId) {
      toast.error("Select a category (or create one first)");
      return;
    }

    setLoading(true);
    try {
      // backend earlier complained about: amount, start_date, end_date required
      // We'll send category_id + amount + start_date + end_date
      const payload = {
        category_id: categoryId,
        amount: Number(amount),
        start_date: startDate,
        end_date: endDate
      };

      const res = await api.post("/budgets", payload);
      // assume success (201)
      toast.success("Budget saved");
      // reset amount but keep selected category
      setAmount("");

      // let other pages know to refresh (dashboard/reports)
      try {
        window.dispatchEvent(new Event("data-updated"));
        if (typeof window.refreshReports === "function") window.refreshReports();
        if (typeof window.refreshDashboard === "function") window.refreshDashboard();
      } catch (e) {
        // noop
      }
    } catch (err) {
      console.error("Failed to save budget", err);
      const msg = err?.response?.data?.message || err?.response?.data || err?.message || "Failed to save budget";
      toast.error(String(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Add budget form">
      <label className="label">Set Budget for Category</label>

      <div style={{ marginBottom: 10 }}>
        <select
          className="input"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          aria-label="Select category"
        >
          <option value="">-- Select category --</option>
          {categories.map((c) => {
            const id = c._id || c.id || c.name || String(c);
            const name = c.name || c.title || c.label || id;
            return <option key={id} value={id}>{name}</option>;
          })}
        </select>
      </div>

      <div style={{ marginBottom: 10 }}>
        <input
          className="input"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="numeric"
          type="number"
          min="0"
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <label className="label">Start date</label>
          <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label className="label">End date</label>
          <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div style={{ textAlign: "right", marginTop: 8 }}>
        <button className="btn" type="submit" disabled={loading}>{loading ? "Saving..." : "Save Budget"}</button>
      </div>
    </form>
  );
}
