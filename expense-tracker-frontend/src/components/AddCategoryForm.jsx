// src/components/AddCategoryForm.jsx
import React, { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function AddCategoryForm(){
  const [name,setName]=useState(''); const [loading,setLoading]=useState(false);
  async function submit(e){
    e.preventDefault();
    if(!name) return toast.error('Name required');
    setLoading(true);
    try{
      await api.post('/categories',{ name });
      toast.success('Category added');
      setName('');
      window.dispatchEvent(new Event('data-updated'));
    }catch(err){
      console.error(err);
      toast.error('Failed to add category');
    }finally{ setLoading(false); }
  }
  return (
    <form className="quickadd-form-area" onSubmit={submit}>
      <label className="label">Category Name</label>
      <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Category name" />
      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:12 }}>
        <button className="btn" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Add'}</button>
      </div>
    </form>
  );
}
