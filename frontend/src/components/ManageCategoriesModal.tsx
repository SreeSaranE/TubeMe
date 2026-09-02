import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Tag,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  AlertTriangle,
  FolderKanban,
  Tv,
} from 'lucide-react';
import { CategoryDetailModel } from '@/types';
import { api } from '@/services/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

  // Deletion confirmation state
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryDetailModel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      setCategoryToDelete(null);
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

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    const name = categoryToDelete.name;
    if (name.toLowerCase() === 'general') return;

    setIsDeleting(true);
    setErrorMsg(null);
    try {
      const res = await api.deleteCategory(name);
      if (res.ok) {
        setCategoryToDelete(null);
        await loadCategories();
        onCategoriesChanged();
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.message || 'Failed to delete category.');
      }
    } catch (err) {
      setErrorMsg('Error connecting to server.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="card max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                Manage Categories
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Create and organize category tabs for your channels
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Alert if any */}
        {errorMsg && (
          <div className="p-3 bg-[var(--danger-subtle)] border border-red-200 text-xs text-[var(--danger)] rounded-[var(--radius-sm)] flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Add New Category Input Form */}
        <form onSubmit={handleAddCategory} className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="New category name (e.g. Cooking, Gaming)..."
              disabled={isSubmitting}
              className="input pl-10 pr-3 text-xs sm:text-sm h-10 w-full"
            />
          </div>
          <button
            type="submit"
            disabled={!newCatName.trim() || isSubmitting}
            className="btn btn-primary text-xs font-semibold h-10 px-4 shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            <span>Add</span>
          </button>
        </form>

        {/* Categories List */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Existing Categories ({categories.length})
          </span>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {isLoading ? (
              <div className="text-center py-8 text-xs text-[var(--text-muted)]">
                Loading categories...
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-xs text-[var(--text-muted)]">
                No custom categories yet.
              </div>
            ) : (
              categories.map((cat) => {
                const isGeneral = cat.name.toLowerCase() === 'general';
                const isEditing = editingName === cat.name;

                return (
                  <div
                    key={cat.name}
                    className="p-2.5 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-between gap-3 text-xs"
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="input h-8 text-xs flex-1"
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
                          className="btn-icon text-emerald-500 hover:text-emerald-400 p-1 cursor-pointer"
                          title="Save"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingName(null)}
                          className="btn-icon text-[var(--text-muted)] p-1 cursor-pointer"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <Tag className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
                        <span className="font-semibold text-xs text-[var(--text-primary)] truncate">
                          {cat.name}
                        </span>
                        {isGeneral && (
                          <span className="text-[10px] bg-zinc-500/10 text-zinc-500 border border-zinc-500/20 px-1.5 py-0.2 rounded font-mono">
                            Default
                          </span>
                        )}
                      </div>
                    )}

                    {/* Stats & Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 font-mono">
                        <Tv className="h-3 w-3" />
                        <span>
                          {cat.channelCount} {cat.channelCount === 1 ? 'channel' : 'channels'}
                        </span>
                      </span>

                      <div className="flex items-center gap-1 border-l border-[var(--border)] pl-2">
                        {!isGeneral && (
                          <button
                            type="button"
                            onClick={() => startRename(cat)}
                            disabled={isSubmitting}
                            className="btn-icon cursor-pointer"
                            title="Rename category"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setCategoryToDelete(cat)}
                          disabled={isGeneral || isSubmitting}
                          className={`btn-icon ${
                            isGeneral
                              ? 'opacity-30 cursor-not-allowed'
                              : 'hover:text-[var(--danger)] cursor-pointer'
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
            className="btn btn-secondary text-xs h-9 px-4 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* Delete Category Confirmation Alert Dialog */}
      <AlertDialog open={Boolean(categoryToDelete)} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              Delete "{categoryToDelete?.name}" Category?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the <strong>"{categoryToDelete?.name}"</strong> category?
              {categoryToDelete && categoryToDelete.channelCount > 0 ? (
                <> All <strong>{categoryToDelete.channelCount}</strong> channel(s) currently in this category will be safely moved to the default <strong>"General"</strong> category.</>
              ) : (
                <> This category will be permanently removed.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteCategory();
              }}
              disabled={isDeleting}
              className="bg-rose-600 text-white hover:bg-rose-700 font-medium cursor-pointer"
            >
              {isDeleting ? 'Deleting...' : 'Delete Category'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
