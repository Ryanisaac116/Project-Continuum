import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supportApi } from '../../api/supportApi';
import { useDialog } from '../../context/DialogContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Send, AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';

/**
 * SupportModal - Handles 'SUPPORT' and 'REPORT' types.
 * 
 * Props:
 * - isOpen (bool)
 * - onClose (fn)
 * - type ('SUPPORT' | 'REPORT')
 * - initialSubject (string) - mainly for Reports
 * - relatedEntity (object: { type, id }) - optional, for Reports
 */
const SupportModal = ({ isOpen, onClose, type = 'SUPPORT', initialSubject = '', relatedEntity = null }) => {
    const [loading, setLoading] = useState(false);
    const dialog = useDialog();

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const subjectValue = formData.get('subject');
        const messageValue = formData.get('message');

        if (!subjectValue?.toString().trim()) {
            await dialog.alert('Validation Error', 'Subject is required');
            return;
        }
        if (!messageValue?.toString().trim()) {
            await dialog.alert('Validation Error', 'Message is required');
            return;
        }

        setLoading(true);
        try {
            if (type === 'REPORT') {
                await supportApi.sendReport(
                    subjectValue,
                    messageValue,
                    relatedEntity?.type,
                    relatedEntity?.id
                );
            } else {
                await supportApi.sendSupport(subjectValue, messageValue);
            }
            // Close the modal first so "Sending..." disappears, then show success
            setLoading(false);
            onClose();
            dialog.alert('Success', type === 'REPORT' ? 'Report submitted.' : 'Support request sent.');
        } catch (err) {
            console.error(err);
            setLoading(false);
            await dialog.alert('Error', 'Failed to send message: ' + (err.response?.data?.message || err.message || 'Unknown error'));
        }
    };

    const isReport = type === 'REPORT';
    const HeaderIcon = isReport ? AlertTriangle : HelpCircle;

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-800">
                {/* Header */}
                <div className={`px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center ${isReport ? 'bg-red-50 dark:bg-red-950/30' : 'bg-indigo-50 dark:bg-indigo-950/30'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isReport ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400' : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'}`}>
                            <HeaderIcon className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                            {isReport ? 'Report Abuse' : 'Contact Support'}
                        </h3>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="support-subject">Subject</Label>
                        <Input
                            id="support-subject"
                            name="subject"
                            type="text"
                            defaultValue={initialSubject}
                            placeholder={isReport ? "Reason for report..." : "How can we help?"}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="support-message">Message</Label>
                        <Textarea
                            id="support-message"
                            name="message"
                            rows={4}
                            placeholder="Describe the issue..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            variant={isReport ? 'destructive' : 'default'}
                            className={!isReport ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Send
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default SupportModal;
