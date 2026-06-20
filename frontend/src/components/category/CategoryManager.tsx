import React, { useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { useCategoryStore } from '../../store/categoryStore';
import { CategoryColumn } from '../../types/category';
import { motion, AnimatePresence } from 'framer-motion';

export const CategoryManager: React.FC = () => {
  const { columns, addColumn, removeColumn, updateColumn } = useCategoryStore();
  const [showForm, setShowForm] = useState(false);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formValues, setFormValues] = useState<string[]>([]);
  const [valueInput, setValueInput] = useState('');

  const openAddForm = () => {
    setEditingColumn(null);
    setFormName('');
    setFormValues([]);
    setValueInput('');
    setShowForm(true);
  };

  const openEditForm = (col: CategoryColumn) => {
    setEditingColumn(col.column_name);
    setFormName(col.column_name);
    setFormValues([...col.possible_values]);
    setValueInput('');
    setShowForm(true);
  };

  const addValue = () => {
    const trimmed = valueInput.trim();
    if (trimmed && !formValues.includes(trimmed)) {
      setFormValues([...formValues, trimmed]);
      setValueInput('');
    }
  };

  const removeValue = (val: string) => {
    setFormValues(formValues.filter((v) => v !== val));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addValue();
    }
  };

  const handleSave = () => {
    const trimmedName = formName.trim();
    if (!trimmedName || formValues.length === 0) return;

    const col: CategoryColumn = {
      column_name: trimmedName,
      possible_values: formValues,
    };

    if (editingColumn) {
      updateColumn(editingColumn, col);
    } else {
      if (columns.some((c) => c.column_name === trimmedName)) return;
      addColumn(col);
    }

    setShowForm(false);
  };

  return (
    <div>
      <div className="category-list">
        <AnimatePresence>
          {columns.map((col) => (
            <motion.div
              key={col.column_name}
              className="category-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              layout
            >
              <div className="category-card-header">
                <span className="category-card-name">{col.column_name}</span>
                <div className="category-card-actions">
                  <button
                    className="btn btn-icon btn-ghost"
                    onClick={() => openEditForm(col)}
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="btn btn-icon btn-ghost"
                    onClick={() => removeColumn(col.column_name)}
                    title="Delete"
                    style={{ color: 'var(--ios-red)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="category-values">
                {col.possible_values.map((val) => (
                  <span key={val} className="chip">{val}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <button
        className="btn btn-secondary"
        onClick={openAddForm}
        style={{ marginTop: 'var(--space-md)' }}
      >
        <Plus size={16} />
        Add Category Column
      </button>

      {/* Modal Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)}
          >
            <motion.div
              className="modal"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3 className="modal-title">
                  {editingColumn ? 'Edit Category' : 'Add Category Column'}
                </h3>
                <button
                  className="btn btn-icon btn-ghost"
                  onClick={() => setShowForm(false)}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                <div className="input-group">
                  <label className="input-label">Column Name</label>
                  <input
                    className="input"
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Plant, Region, Module"
                    disabled={!!editingColumn}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Possible Values</label>
                  <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <input
                      className="input"
                      type="text"
                      value={valueInput}
                      onChange={(e) => setValueInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a value and press Enter"
                    />
                    <button className="btn btn-secondary" onClick={addValue}>
                      Add
                    </button>
                  </div>
                  {formValues.length > 0 && (
                    <div className="category-values" style={{ marginTop: 'var(--space-sm)' }}>
                      {formValues.map((val) => (
                        <span key={val} className="chip">
                          {val}
                          <button className="chip-remove" onClick={() => removeValue(val)}>
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={!formName.trim() || formValues.length === 0}
                >
                  {editingColumn ? 'Update' : 'Add Column'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
