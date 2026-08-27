import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Tag,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  FolderKanban,
  Tv,
} from 'lucide-react';
import { CategoryDetailModel } from '@/types';
import { api } from '@/services/api';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesChanged: () => void;
}

export function ManageCategoriesModal({
  isOpen,
  onClose,
  onCategoriesChanged,
}: ManageCategoriesModalProps) {
  const [categories, setCategories] = useState<CategoryDetailModel[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [editingName, setEditingName] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCategoriesDetails();
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      setErrorMsg(null);
      setEditingName(null);
      setNewCatName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newCatName.trim();
    if (!cleanName) return;

    if (categories.some((c) => c.name.toLowerCase() === cleanName.toLowerCase())) {
      setErrorMsg(`Category "${cleanName}" already exists.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await api.addCategory(cleanName);
      if (res.ok) {
        setNewCatName('');
        await loadCategories();
        onCategoriesChanged();
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.message || 'Failed to add category.');
      }
    } catch (err) {
      setErrorMsg('Error connecting to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startRename = (cat: CategoryDetailModel) => {
    setEditingName(cat.name);
    setRenameValue(cat.name);
    setErrorMsg(null);
  };

  const handleSaveRename = async (oldName: string) => {
    const cleanNew = renameValue.trim();
    if (!cleanNew) {
      setErrorMsg('Category name cannot be empty.');
      return;
    }

    if (oldName.toLowerCase() === cleanNew.toLowerCase()) {
      setEditingName(null);
      return;
    }

    if (categories.some((c) => c.name.toLowerCase() === cleanNew.toLowerCase())) {
      setErrorMsg(`Category "${cleanNew}" already exists.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await api.renameCategory(oldName, cleanNew);
      if (res.ok) {
        setEditingName(null);
        await loadCategories();
        onCategoriesChanged();
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.message || 'Failed to rename category.');
      }
    } catch (err) {
      setErrorMsg('Error connecting to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (name: string, count: number) => {
    if (name.toLowerCase() === 'general') return;

    const confirmMsg =
      count > 0
        ? `Delete "${name}" category? ${count} channel(s) in this category will be moved to "General".`
        : `Delete "${name}" category?`;

    if (!window.confirm(confirmMsg)) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await api.deleteCategory(name);
      if (res.ok) {
        await loadCategories();
        onCategoriesChanged();
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.message || 'Failed to delete category.');
      }
    } catch (err) {
      setErrorMsg('Error connecting to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="card max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--primary-subtle)] border border-blue-200 flex items-center justify-center text-[var(--primary)] shrink-0">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <span className="type-pill">Category Management</span>
              <h3 className="text-base font-bold text-[var(--text-primary)] mt-1">
                Manage Channel Categories
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-[var(--radius-sm)] bg-[var(--danger-subtle)] border border-red-200 text-[var(--danger)] text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Add New Category Form */}
        <form onSubmit={handleAddCategory} className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="h-3.5 w-3.5 text-[var(--text-muted)] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Create new category (e.g. Podcasts, Linux, Music)..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              disabled={isSubmitting}
              className="w-full pl-9 pr-3 h-10 text-xs bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>
          <button
            type="submit"
            disabled={!newCatName.trim() || isSubmitting}
            className="btn btn-primary btn-glow h-10 px-4 text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </button>
        </form>

        {/* Categories List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-mono px-1">
            <span>CATEGORY ({categories.length})</span>
            <span>ASSIGNED CHANNELS</span>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {isLoading ? (
              <div className="text-center py-8 text-xs text-[var(--text-muted)]">
                Loading categories...
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-xs text-[var(--text-muted)]">
                No categories found.
              </div>
            ) : (
              categories.map((cat) => {
                const isGeneral = cat.name.toLowerCase() === 'general';
                const isEditing = editingName === cat.name;

                return (
                  <div
                    key={cat.name}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--primary)] transition-colors"
                  >
                    {/* Left: Category Name / Rename Input */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <Tag className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 flex-1 max-w-xs">
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            className="h-8 px-2 text-xs bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[var(--text-primary)]"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(cat.name);
                              if (e.key === 'Escape') setEditingName(null);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(cat.name)}
                            disabled={isSubmitting}
                            className="btn-icon text-emerald-600 hover:bg-emerald-50"
                            title="Save"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingName(null)}
                            className="btn-icon"
                            title="Cancel"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold text-xs text-[var(--text-primary)] truncate">
                            {cat.name}
                          </span>
                          {isGeneral && (
                            <span className="text-[10px] font-mono px-2 py-0.2 rounded-[var(--radius-full)] bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border)]">
                              Default
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: Channel Count + Action Buttons */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] font-mono">
                        <Tv className="h-3 w-3 opacity-70" />
                        <span>{cat.channelCount}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={() => startRename(cat)}
                            className="btn-icon"
                            title="Rename category"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(cat.name, cat.channelCount)}
                          disabled={isGeneral || isSubmitting}
                          className={`btn-icon ${
                            isGeneral
                              ? 'opacity-30 cursor-not-allowed'
                              : 'hover:text-[var(--danger)]'
                          }`}
                          title={
                            isGeneral
                              ? "Default 'General' category cannot be deleted"
                              : 'Delete category'
                          }
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-[var(--border)] pt-3">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary text-xs h-9 px-4"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
