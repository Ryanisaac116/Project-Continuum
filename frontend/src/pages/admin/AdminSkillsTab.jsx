import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { useDialog } from '../../context/DialogContext';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const emptyForm = {
    name: '',
    category: '',
};

const emptyQuickForm = {
    categoryName: '',
    firstSkillName: '',
};

const AdminSkillsTab = () => {
    const dialog = useDialog();
    const [skills, setSkills] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [quickCreating, setQuickCreating] = useState(false);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [quickForm, setQuickForm] = useState(emptyQuickForm);

    const groupedCount = useMemo(() => {
        const groups = new Set(skills.map((s) => s.category));
        return groups.size;
    }, [skills]);

    const loadData = useCallback(async ({ showLoader = false } = {}) => {
        if (showLoader) setLoading(true);
        try {
            const [skillsRes, categoriesRes] = await Promise.all([
                adminApi.getSkills(),
                adminApi.getSkillCategories(),
            ]);
            setSkills(skillsRes.data || []);
            setCategories(categoriesRes.data || []);
            setError('');
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to load skills');
        } finally {
            if (showLoader) setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData({ showLoader: true });
    }, [loadData]);

    const resetForm = () => {
        setEditingId(null);
        setForm(emptyForm);
    };

    const handleSaveSkill = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.category.trim()) {
            setError('Skill name and category are required');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name: form.name.trim(),
                category: form.category.trim(),
            };
            if (editingId) {
                await adminApi.updateSkill(editingId, payload);
            } else {
                await adminApi.createSkill(payload);
            }
            await loadData();
            resetForm();
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to save skill');
        } finally {
            setSaving(false);
        }
    };

    const handleQuickCreate = async (e) => {
        e.preventDefault();

        const categoryName = quickForm.categoryName.trim();
        const firstSkillName = quickForm.firstSkillName.trim();

        if (!categoryName || !firstSkillName) {
            setError('Category name and first skill are required');
            return;
        }

        setQuickCreating(true);
        try {
            await adminApi.createSkill({
                name: firstSkillName,
                category: categoryName,
            });

            await loadData();
            setForm((prev) => ({ ...prev, category: categoryName }));
            setQuickForm(emptyQuickForm);
            setError('');
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to quick create category and skill');
        } finally {
            setQuickCreating(false);
        }
    };

    const handleDeleteSkill = async (skill) => {
        const ok = await dialog.confirm(
            'Delete Skill',
            `Delete "${skill.name}" from "${skill.category}"?`,
            'Delete',
            'destructive'
        );
        if (!ok) return;

        try {
            await adminApi.deleteSkill(skill.id);
            setSkills((prev) => prev.filter((s) => s.id !== skill.id));
        } catch (err) {
            await dialog.alert('Error', err?.response?.data?.message || 'Failed to delete skill');
        }
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Skill Management</h2>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-right">
                    {skills.length} skills | {groupedCount} categories
                </span>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Quick Create Category + First Skill</h3>
                    <form onSubmit={handleQuickCreate} className="space-y-3">
                        <input
                            value={quickForm.categoryName}
                            onChange={(e) => setQuickForm((prev) => ({ ...prev, categoryName: e.target.value }))}
                            placeholder="Category name"
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                        />
                        <input
                            value={quickForm.firstSkillName}
                            onChange={(e) => setQuickForm((prev) => ({ ...prev, firstSkillName: e.target.value }))}
                            placeholder="First skill name"
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                        />
                        <div className="flex items-center gap-2">
                            <Button type="submit" size="sm" disabled={quickCreating}>
                                <Plus className="w-4 h-4 mr-1.5" />
                                {quickCreating ? 'Creating...' : 'Quick Create'}
                            </Button>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Category is created when the first skill is saved.
                            </p>
                        </div>
                    </form>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {editingId ? 'Edit Skill' : 'Add Skill'}
                    </h3>
                    <form onSubmit={handleSaveSkill} className="space-y-3">
                        <input
                            value={form.name}
                            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="Skill name"
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                        />
                        <input
                            value={form.category}
                            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                            placeholder="Category"
                            list="skill-category-options"
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                        />
                        <datalist id="skill-category-options">
                            {categories.map((cat) => (
                                <option key={cat} value={cat} />
                            ))}
                        </datalist>
                        <div className="flex flex-wrap gap-2">
                            <Button type="submit" disabled={saving}>
                                {saving ? 'Saving...' : editingId ? 'Update Skill' : 'Create Skill'}
                            </Button>
                            {editingId && (
                                <Button type="button" variant="outline" onClick={resetForm}>
                                    Cancel
                                </Button>
                            )}
                        </div>
                    </form>
                    {categories.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                            {categories.map((cat) => (
                                <span
                                    key={cat}
                                    className="px-2.5 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                                >
                                    {cat}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px]">
                        <thead>
                            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Skill</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {skills.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                        No skills found
                                    </td>
                                </tr>
                            ) : (
                                skills.map((skill) => (
                                    <tr key={skill.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{skill.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{skill.category}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEditingId(skill.id);
                                                        setForm({ name: skill.name, category: skill.category });
                                                    }}
                                                    className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                >
                                                    <Pencil className="w-4 h-4 mr-1.5" />
                                                    <span className="hidden sm:inline">Edit</span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteSkill(skill)}
                                                    className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-1.5" />
                                                    <span className="hidden sm:inline">Delete</span>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminSkillsTab;
