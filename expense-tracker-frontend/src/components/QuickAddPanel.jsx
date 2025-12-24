// src/components/QuickAddPanel.jsx
import React, { useState } from 'react';
import AddCategoryForm from './AddCategoryForm';
import AddSourceForm from './AddSourceForm';
import AddIncomeForm from './AddIncomeForm';
import AddExpenseForm from './AddExpenseForm';

export default function QuickAddPanel() {
  const [tab, setTab] = useState('income');

  return (
    <div style={{ maxWidth: 420 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button className={`tab ${tab==='income'?'active':''}`} onClick={() => setTab('income')}>Income</button>
        <button className={`tab ${tab==='expense'?'active':''}`} onClick={() => setTab('expense')}>Expense</button>
        <button className={`tab ${tab==='category'?'active':''}`} onClick={() => setTab('category')}>Add Category</button>
        <button className={`tab ${tab==='source'?'active':''}`} onClick={() => setTab('source')}>Add Source</button>
        <button className={`tab ${tab==='budget'?'active':''}`} onClick={() => setTab('budget')}>Add Budget</button>
      </div>

      <div>
        {tab === 'category' && <AddCategoryForm />}
        {tab === 'source' && <AddSourceForm />}
        {tab === 'income' && <AddIncomeForm />}
        {tab === 'expense' && <AddExpenseForm />}
        {tab === 'budget' && (require('./AddBudgetForm').default ? require('./AddBudgetForm').default() : <div />)}
      </div>

      <style jsx>{`
        .tab {
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid rgba(2,6,23,0.04);
          background: transparent;
          cursor: pointer;
          font-weight:600;
        }
        .tab.active {
          background: linear-gradient(90deg,#eef6ff,#eaf8ff);
          color: #1e4ed8;
          border-color: rgba(43,110,246,0.12);
        }
      `}</style>
    </div>
  );
}
