import React, { useEffect, useState } from 'react';
import { profileApi } from '../../api/profile';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useDialog } from '../../context/DialogContext';
import { AlertTriangle } from 'lucide-react';

export const AddSkillForm = ({ onSuccess, onCancel }) => {
    const [systemSkills, setSystemSkills] = useState([]);
    const [selectedSkill, setSelectedSkill] = useState('');
    const [type, setType] = useState('LEARN');
    const [level, setLevel] = useState('BEGINNER');
    const [loading, setLoading] = useState(false);
    const dialog = useDialog();

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
            setLoading(false);
        } catch {
            setLoading(false);
            await dialog.alert('Error', 'Failed to add skill');
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
        <form onSubmit={handleSubmit} className="p-4 rounded-lg border bg-muted/30 space-y-4">

            {/* Validation Warning Banner */}
            {validationWarning && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm rounded-md border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>{validationWarning}</span>
                </div>
            )}

            <div className="space-y-1">
                <Label>Select Skill</Label>
                <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                <div className="space-y-1">
                    <Label>Type</Label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={type}
                        onChange={e => setType(e.target.value)}
                    >
                        <option value="LEARN">Learn</option>
                        <option value="TEACH">Teach</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <Label>Level</Label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
