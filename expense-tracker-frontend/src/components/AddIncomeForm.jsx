// src/components/AddIncomeForm.jsx
import React, { useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function AddIncomeForm({ sources = [], onAdded }) {
  const [sourceId, setSourceId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || !sourceId) {
      toast.error("Please enter amount and select a source");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        source_id: sourceId,
        amount: amt,
        description: description || "",
        date,
      };
      const res = await api.post("/incomes", payload);
      toast.success("Income added");
      window.dispatchEvent(new Event("data-updated"));
      if (typeof onAdded === "function") onAdded(res.data);
      setAmount("");
      setDescription("");
      setSourceId("");
    } catch (err) {
      console.error("Add income error", err);
      const msg = err?.response?.data?.message || "Failed to add income";
      toast.error(String(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <label className="label">Source</label>
      <select className="input" value={sourceId} onChange={e => setSourceId(e.target.value)}>
        <option value="">Select source</option>
        {Array.isArray(sources) && sources.map(s => (
          <option key={s._id || s.id || s.name} value={s._id || s.id || s.name}>{s.name || s.title || String(s)}</option>
        ))}
      </select>

      <label className="label">Amount</label>
      <input className="input" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" type="number" step="any" />

      <label className="label">Description</label>
      <input className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Title/Description (optional)" />

      <label className="label">Date</label>
      <input className="input" value={date} onChange={e => setDate(e.target.value)} type="date" />

      <div style={{ textAlign: "right" }}>
        <button className="btn" type="submit" disabled={loading}>{loading ? "Adding..." : "Add"}</button>
      </div>
    </form>
  );
}
