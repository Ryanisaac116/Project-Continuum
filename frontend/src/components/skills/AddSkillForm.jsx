import React, { useEffect, useState } from 'react';
import { profileApi } from '../../api/profile';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export const AddSkillForm = ({ onSuccess, onCancel }) => {
    const [systemSkills, setSystemSkills] = useState([]);
    const [selectedSkill, setSelectedSkill] = useState('');
    const [type, setType] = useState('LEARN');
    const [level, setLevel] = useState('BEGINNER');
    const [loading, setLoading] = useState(false);

    const [userSkills, setUserSkills] = useState([]);

    useEffect(() => {
        // Fetch available system skills
        profileApi.getAllSkills().then(res => setSystemSkills(res.data));
        // Fetch current user skills for validation
        profileApi.getUserSkills().then(res => setUserSkills(res.data));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedSkill) return;

        if (validationWarning) return;

        setLoading(true);
        try {
            await profileApi.addUserSkill({
                skillId: selectedSkill,
                skillType: type,
                level: level
            });
            onSuccess();
        } catch (err) {
            alert("Failed to add skill");
        } finally {
            setLoading(false);
        }
    };

    const getValidationWarning = () => {
        if (!selectedSkill) return null;

        const skillObj = systemSkills.find(s => s.id === parseInt(selectedSkill));
        if (!skillObj) return null;

        const existingExact = userSkills.find(
            us => (us.skillId || us.skill?.id) === parseInt(selectedSkill) && us.type === type
        );
        if (existingExact) {
            return `You already have ${skillObj.name} as a ${type} skill.`;
        }

        const existingOpposite = userSkills.find(
            us => (us.skillId || us.skill?.id) === parseInt(selectedSkill) && us.type !== type
        );

        if (existingOpposite) {
            const cat = (skillObj.category || '').toLowerCase();
            const isLanguage = cat === 'languages' || cat === 'language';
            if (!isLanguage) {
                return `You cannot Teach and Learn the same skill (${skillObj.name}). This is only allowed for Languages.`;
            }
        }
        return null;
    };

    const validationWarning = getValidationWarning();

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 space-y-4 transition-colors">

            {/* Validation Warning Banner */}
            {validationWarning && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm rounded-md border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                    <span>⚠️</span>
                    <span>{validationWarning}</span>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Select Skill</label>
                <select
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={selectedSkill}
                    onChange={e => setSelectedSkill(e.target.value)}
                >
                    <option value="">-- Choose Skill --</option>
                    {(() => {
                        const grouped = systemSkills.reduce((acc, s) => {
                            const cat = s.category || 'Other';
                            if (!acc[cat]) acc[cat] = [];
                            acc[cat].push(s);
                            return acc;
                        }, {});

                        return Object.entries(grouped).map(([category, skills]) => (
                            <optgroup key={category} label={category}>
                                {skills.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </optgroup>
                        ));
                    })()}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                    <select
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={type}
                        onChange={e => setType(e.target.value)}
                    >
                        <option value="LEARN">Learn</option>
                        <option value="TEACH">Teach</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Level</label>
                    <select
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={level}
                        onChange={e => setLevel(e.target.value)}
                    >
                        <option value="BEGINNER">Beginner</option>
                        <option value="INTERMEDIATE">Intermediate</option>
                        <option value="ADVANCED">Advanced</option>
                        <option value="EXPERT">Expert</option>
                    </select>
                </div>
            </div>

            <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
                <Button type="submit" size="sm" disabled={loading || !selectedSkill || !!validationWarning}>Add Skill</Button>
            </div>
        </form>
    );
};
