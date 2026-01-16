import React, { useEffect, useState } from 'react';
import { profileApi } from '../../api/profile';
import { Button } from '../ui/Button';

/**
 * SkillsList - Displays user skills with edit and delete functionality
 * 
 * Features:
 * - View skills with type (TEACHING/LEARNING) and level
 * - Inline edit mode for level and type
 * - Optimistic UI updates
 */
export const SkillsList = ({ refreshTrigger }) => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ level: '', skillType: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSkills();
  }, [refreshTrigger]);

  const loadSkills = async () => {
    try {
      const { data } = await profileApi.getUserSkills();
      setSkills(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load skills', err);
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this skill?')) return;

    try {
      await profileApi.deleteUserSkill(id);
      setSkills((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
      if (err.response?.status !== 404) {
        alert('Failed to delete skill');
      }
    }
  };

  const startEdit = (skill) => {
    setEditingId(skill.id);
    setEditForm({
      level: skill.level || 'BEGINNER',
      skillType: (skill.skillType || skill.type || 'LEARN').toUpperCase()
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ level: '', skillType: '' });
  };

  const handleUpdate = async (id) => {
    if (saving) return;
    setSaving(true);

    try {
      const { data } = await profileApi.updateUserSkill(id, editForm);

      // Update local state with response
      setSkills((prev) => prev.map((s) =>
        s.id === id
          ? { ...s, level: editForm.level, skillType: editForm.skillType, ...data }
          : s
      ));

      setEditingId(null);
      setEditForm({ level: '', skillType: '' });
    } catch (err) {
      console.error('Failed to update skill:', err);
      alert(err.response?.data?.message || 'Failed to update skill');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading skills…</div>;
  }

  if (!skills.length) {
    return <div className="text-sm text-gray-500 py-4">No skills added yet.</div>;
  }

  return (
    <div className="space-y-6">
      {Object.entries(
        skills.reduce((acc, s) => {
          const cat = s.skill?.category || s.category || 'Programming'; // Fallback for old data
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(s);
          return acc;
        }, {})
      ).map(([category, categorySkills]) => (
        <div key={category}>
          <h4 className="text-sm font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2 transition-colors">
            {category}
          </h4>
          <div className="space-y-3">
            {categorySkills.map((us) => {
              const isEditing = editingId === us.id;
              // Skill name (flat or nested)
              const skillName = us.skillName || us.skill?.name || us.skill || 'Unnamed Skill';

              // Skill type normalization
              const rawType = us.skillType || us.type || '';
              const normalizedType = rawType.toUpperCase();
              const isTeach = normalizedType === 'TEACH' || normalizedType === 'TEACHING';

              if (isEditing) {
                return (
                  <div
                    key={us.id}
                    className="p-4 rounded-lg border-2 border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-900/10 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white mb-3 transition-colors">{skillName}</div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {/* Skill Type */}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1 transition-colors">
                          Type
                        </label>
                        <select
                          value={editForm.skillType}
                          onChange={(e) => setEditForm({ ...editForm, skillType: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        >
                          <option value="TEACH">Teaching</option>
                          <option value="LEARN">Learning</option>
                        </select>
                      </div>

                      {/* Level */}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1 transition-colors">
                          Level
                        </label>
                        <select
                          value={editForm.level}
                          onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        >
                          <option value="BEGINNER">Beginner</option>
                          <option value="INTERMEDIATE">Intermediate</option>
                          <option value="EXPERT">Expert</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={cancelEdit}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUpdate(us.id)}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={us.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/80 transition-colors"
                >
                  {/* LEFT */}
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-gray-900 dark:text-white transition-colors">
                      {skillName}
                    </span>

                    <div className="flex items-center gap-2 text-xs">
                      {/* TEACH / LEARN INDICATOR */}
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold tracking-wide border transition-colors
                          ${isTeach
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                          }`}
                      >
                        {isTeach ? 'TEACHING' : 'LEARNING'}
                      </span>

                      {/* LEVEL */}
                      {us.level && (
                        <span className="text-gray-500 dark:text-slate-400 uppercase tracking-wide transition-colors">
                          {us.level}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* RIGHT - Actions */}
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      onClick={() => startEdit(us)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      onClick={() => handleDelete(us.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
