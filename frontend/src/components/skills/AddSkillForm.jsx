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

    useEffect(() => {
        // Fetch available system skills
        profileApi.getAllSkills().then(res => setSystemSkills(res.data));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedSkill) return;

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

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Skill</label>
                <select
                    className="w-full rounded-md border border-gray-300 p-2 text-sm"
                    value={selectedSkill}
                    onChange={e => setSelectedSkill(e.target.value)}
                >
                    <option value="">-- Choose Skill --</option>
                    {systemSkills.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
                        value={type}
                        onChange={e => setType(e.target.value)}
                    >
                        <option value="LEARN">Learn</option>
                        <option value="TEACH">Teach</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                    <select
                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
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
                <Button type="submit" size="sm" disabled={loading || !selectedSkill}>Add Skill</Button>
            </div>
        </form>
    );
};
