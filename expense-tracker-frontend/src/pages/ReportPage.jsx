// src/pages/ReportPage.jsx
import React, { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import toast, { Toaster } from "react-hot-toast";
import Header from "../components/Header";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./reports.css";

const COLORS = ["#4caf50", "#ff9800", "#2196f3", "#f44336", "#9c27b0", "#00bcd4", "#ff5722"];

function aggregate(items = [], keyGetter, amountGetter = (i) => Number(i.amount || 0)) {
  const m = new Map();
  items.forEach((it) => {
    const key = keyGetter(it) || "Unknown";
    m.set(key, (m.get(key) || 0) + (Number(amountGetter(it)) || 0));
  });
  return Array.from(m.entries()).map(([k, v]) => ({ key: k, value: v }));
}

function groupByPeriod(items = [], dateGetter, granularity = "day") {
  const map = new Map();
  items.forEach((it) => {
    const raw = dateGetter(it);
    if (!raw) return;
    const d = new Date(raw);
    const key = granularity === "month" ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` : raw.slice(0, 10);
    if (!map.has(key)) map.set(key, { period: key, income: 0, expense: 0 });
    const entry = map.get(key);
    if ((it.type || "").toLowerCase() === "income") entry.income += Number(it.amount || 0);
    else entry.expense += Number(it.amount || 0);
  });
  return Array.from(map.values()).sort((a, b) => (a.period < b.period ? -1 : 1));
}

export default function ReportPage() {
  const defaultEnd = new Date();
  const defaultStart = new Date();
  defaultStart.setDate(defaultEnd.getDate() - 30);

  const [start, setStart] = useState(() => defaultStart.toISOString().slice(0, 10));
  const [end, setEnd] = useState(() => defaultEnd.toISOString().slice(0, 10));
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [incomeBySource, setIncomeBySource] = useState([]);
  const [expenseByCategory, setExpenseByCategory] = useState([]);
  const [budgetVsCategory, setBudgetVsCategory] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const reportRef = useRef(null);

  async function fetchAndAggregate() {
    setLoading(true);
    try {
      const q = `?start_date=${encodeURIComponent(start)}&end_date=${encodeURIComponent(end)}`;
      const [incRes, expRes, budRes] = await Promise.all([
        api.get(`/incomes${q}`),
        api.get(`/expenses${q}`),
        api.get(`/budgets${q}`)
      ]);

      const incomesData = incRes.data || [];
      const expensesData = expRes.data || [];
      const budgetsData = budRes.data || [];

      setIncomes(incomesData);
      setExpenses(expensesData);

      const incAgg = aggregate(
        incomesData,
        (i) => (i.source && (i.source.name || i.source.title)) ? (i.source.name || i.source.title) : (i.source || i.source_id || "Unknown"),
        (i) => i.amount
      );
      setIncomeBySource(incAgg.map(a => ({ source_name: a.key, total: a.value })));

      const expAgg = aggregate(
        expensesData,
        (e) => {
          if (e.category && typeof e.category === "object") return e.category.name || e.category.title || (e.category._id || e.category.id) || "Uncategorized";
          if (e.category_id) return String(e.category_id);
          if (e.category) return String(e.category);
          return "Uncategorized";
        },
        (e) => e.amount
      );
      setExpenseByCategory(expAgg.map(a => ({ category_name: a.key, total: a.value })));

      const spentAgg = aggregate(
        expensesData,
        (e) => {
          if (e.category && typeof e.category === "object") return String(e.category._id || e.category.id || e.category.name || e.category);
          if (e.category_id) return String(e.category_id);
          if (e.category) return String(e.category);
          return "uncat";
        },
        (e) => e.amount
      );
      const spentMap = new Map(spentAgg.map(s => [String(s.key), s.value]));

      const categoryLookup = new Map();
      budgetsData.forEach(b => {
        if (b.category && typeof b.category === "object") {
          const id = String(b.category._id || b.category.id || b.category.name || b.category);
          const name = b.category.name || b.category.title || b.category.label || b.categoryName || null;
          if (id) categoryLookup.set(id, name || id);
        }
        if (b.categoryName) categoryLookup.set(String(b.categoryName), b.categoryName);
        if (b.name && !categoryLookup.has(String(b.name))) categoryLookup.set(String(b.name), b.name);
      });

      const budgetsMapped = (budgetsData || []).map(b => {
        let catId = null;
        if (b.category && typeof b.category === "object") catId = String(b.category._id || b.category.id || b.category.name || b.category);
        else if (b.category_id) catId = String(b.category_id);
        else if (b.category) catId = String(b.category);
        else if (b.categoryName) catId = String(b.categoryName);
        else if (b.name) catId = String(b.name);
        else catId = `budget-${Math.random()}`;

        let catName = null;
        if (b.category && typeof b.category === "object") catName = b.category.name || b.category.title || b.category.label || null;
        if (!catName && b.categoryName) catName = b.categoryName;
        if (!catName && b.name) catName = b.name;
        if (!catName && categoryLookup.has(catId)) catName = categoryLookup.get(catId);
        if (!catName) catName = "Uncategorized";

        const budgetAmount = Number(b.amount || b.budget || 0);
        const spent = Number(spentMap.get(catId) || 0);

        return { id: catId, name: String(catName), budget: budgetAmount, spent };
      });

      setBudgetVsCategory(budgetsMapped);

      const typedIncomes = incomesData.map(i => ({ ...i, type: 'income' }));
      const typedExpenses = expensesData.map(e => ({ ...e, type: 'expense' }));
      setTrend(groupByPeriod([...typedIncomes, ...typedExpenses], it => it.date || it.createdAt || it.timestamp, 'day'));

      toast.success('Report generated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAndAggregate();
  }, []);

  useEffect(() => {
    const fn = () => fetchAndAggregate();
    window.addEventListener('data-updated', fn);
    window.refreshReports = fetchAndAggregate;
    return () => {
      window.removeEventListener('data-updated', fn);
      try { delete window.refreshReports; } catch(e) {}
    };
  }, [start, end]);

  function downloadCSV() {
    const rows = [['type', 'date', 'amount', 'category/source', 'description']];
    incomes.forEach(i => rows.push(['income', i.date?.slice(0, 10) || '', i.amount, (i.source && (i.source.name || i.source.title)) || i.source || '', i.description || '']));
    expenses.forEach(e => rows.push(['expense', e.date?.slice(0, 10) || '', e.amount, (e.category && (e.category.name || e.category.title)) || e.category || '', e.description || '']));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${start}_to_${end}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handleReset() {
    const dEnd = new Date();
    const dStart = new Date();
    dStart.setDate(dEnd.getDate() - 30);
    setStart(dStart.toISOString().slice(0,10));
    setEnd(dEnd.toISOString().slice(0,10));
  }

  async function generatePDF() {
    if (!reportRef.current) {
      toast.error('Nothing to capture');
      return;
    }
    setPdfLoading(true);
    try {
      const input = reportRef.current;
      const scale = 2;
      const canvas = await html2canvas(input, {
        scale,
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: canvas.width > canvas.height ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const ratio = Math.min(pageWidth / imgProps.width, pageHeight / imgProps.height);
      const imgRenderWidth = imgProps.width * ratio;
      const imgRenderHeight = imgProps.height * ratio;
      const x = (pageWidth - imgRenderWidth) / 2;
      const y = 20;
      pdf.addImage(imgData, 'PNG', x, y, imgRenderWidth, imgRenderHeight, undefined, 'FAST');
      pdf.setProperties({ title: `Report ${start} - ${end}` });
      pdf.save(`report_${start}_to_${end}.pdf`);
      toast.success('PDF downloaded');
    } catch (err) {
      console.error('PDF error', err);
      toast.error('Failed to create PDF');
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <>
      <Header />
      <div className="reports-root page-content" ref={reportRef}>
        <Toaster position="top-right" />
        <div className="report-top-controls-card card">
          <div className="controls-left">
            <label className="label">From</label>
            <input type="date" className="input small-input" value={start} onChange={e => setStart(e.target.value)} />
            <span className="range-sep">to</span>
            <label className="label">To</label>
            <input type="date" className="input small-input" value={end} onChange={e => setEnd(e.target.value)} />
          </div>

          <div className="controls-right">
            <button className="btn btn-secondary" onClick={handleReset} disabled={loading || pdfLoading}>Reset</button>
            <button className="btn" onClick={fetchAndAggregate} disabled={loading || pdfLoading}>{loading ? 'Generating...' : 'Generate'}</button>
            <button className="btn btn-ghost" onClick={downloadCSV} disabled={loading || pdfLoading || (incomes.length === 0 && expenses.length === 0)}>Download CSV</button>
            <button className="btn btn-pdf" onClick={generatePDF} disabled={pdfLoading || loading}>{pdfLoading ? 'Preparing PDF...' : 'Download PDF'}</button>
          </div>
        </div>

        <div className="report-main-grid">
          <div className="left-column">
            <section className="card large-chart-card">
              <h4 className="chart-title">Income by Source</h4>
              {incomeBySource.length === 0 ? <div className="no-data">No data for selected period</div> : (
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={incomeBySource.map(i => ({ name: i.source_name || i.key, value: Number(i.total || i.value || 0) }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip formatter={v => v.toLocaleString()} />
                      <Legend />
                      <Bar dataKey="value">{incomeBySource.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="card large-chart-card">
              <h4 className="chart-title">Income vs Expense Trend</h4>
              {trend.length === 0 ? <div className="no-data">No trend data</div> : (
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip formatter={v => v.toLocaleString()} />
                      <Legend />
                      <Line type="monotone" dataKey="income" stroke="#4caf50" dot={false} />
                      <Line type="monotone" dataKey="expense" stroke="#f44336" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          </div>

          <aside className="right-column">
            <div className="card small-card">
              <h4 className="chart-title">Expense by Category</h4>
              {expenseByCategory.length === 0 ? <div className="no-data">No expenses</div> : (
                <div className="chart-wrap-small">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expenseByCategory.map(c => ({ name: c.category_name || c.key, value: Number(c.total || c.value || 0) }))} dataKey="value" nameKey="name" outerRadius={80} label>
                        {expenseByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={v => v.toLocaleString()} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="card small-card">
              <h4 className="chart-title">Budget vs Category</h4>
              {budgetVsCategory.length === 0 ? <div className="no-data">No budgets defined</div> : (
                <div className="chart-wrap-small">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={budgetVsCategory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip formatter={v => v.toLocaleString()} />
                      <Legend />
                      <Bar dataKey="budget" name="Budget" fill="#1976d2" />
                      <Bar dataKey="spent" name="Spent" fill="#f44336" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
