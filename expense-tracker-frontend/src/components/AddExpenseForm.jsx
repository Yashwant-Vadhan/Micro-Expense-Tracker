// src/components/AddExpenseForm.jsx
import React, { useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function AddExpenseForm({ categories = [], onAdded }) {
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  // small helper to get current balance from API
  async function getCurrentBalance() {
    try {
      const [incRes, expRes] = await Promise.all([api.get("/incomes"), api.get("/expenses")]);
      const incomes = Array.isArray(incRes.data) ? incRes.data : [];
      const expenses = Array.isArray(expRes.data) ? expRes.data : [];
      const totalIn = incomes.reduce((s, i) => s + Number(i.amount || 0), 0);
      const totalEx = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
      return Math.round((totalIn - totalEx) * 100) / 100;
    } catch (err) {
      console.warn("Failed to fetch balance for check", err);
      return null;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || !categoryId) {
      toast.error("Please enter amount and select a category");
      return;
    }

    setLoading(true);
    try {
      const balance = await getCurrentBalance();
      if (balance !== null && balance - amt < 0) {
        toast.error("Insufficient funds — add income before adding this expense");
        setLoading(false);
        return;
      }

      const payload = {
        category_id: categoryId,
        amount: amt,
        description: description || "",
        date,
      };
      const res = await api.post("/expenses", payload);
      toast.success("Expense added");
      window.dispatchEvent(new Event("data-updated"));
      if (typeof onAdded === "function") onAdded(res.data);
      setAmount("");
      setDescription("");
      setCategoryId("");
    } catch (err) {
      console.error("Add expense error", err);
      const msg = err?.response?.data?.message || "Failed to add expense";
      toast.error(String(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <label className="label">Category</label>
      <select className="input" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
        <option value="">Select category</option>
        {Array.isArray(categories) && categories.map(c => (
          <option key={c._id || c.id || c.name} value={c._id || c.id || c.name}>{c.name || c.title || String(c)}</option>
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
