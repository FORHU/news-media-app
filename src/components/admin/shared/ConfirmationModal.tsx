"use client";

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive' | 'warning';
    isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onOpenChange,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "default",
    isLoading = false
}) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'destructive':
                return 'bg-[#ff4500] hover:bg-orange-600 text-white';
            case 'warning':
                return 'bg-orange-500 hover:bg-orange-600 text-white';
            default:
                return 'bg-[#ff4500] hover:bg-orange-600 text-white';
        }
    };

    const getIconColor = () => {
        switch (variant) {
            case 'destructive':
                return 'text-[#ff4500]';
            case 'warning':
                return 'text-orange-500';
            default:
                return 'text-[#ff4500]';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-50 mx-auto">
                        <AlertCircle className={`w-8 h-8 ${getIconColor()}`} />
                    </div>
                    
                    <DialogHeader className="space-y-3">
                        <DialogTitle className="text-2xl font-black text-center text-gray-900 tracking-tight">
                            {title}
                        </DialogTitle>
                        <DialogDescription className="text-center text-gray-500 font-medium leading-relaxed">
                            {description}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Button 
                            variant="ghost" 
                            onClick={() => onOpenChange(false)}
                            className="flex-1 h-14 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all order-2 sm:order-1"
                            disabled={isLoading}
                        >
                            {cancelText}
                        </Button>
                        <Button 
                            onClick={onConfirm}
                            className={`flex-1 h-14 rounded-2xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 order-1 sm:order-2 ${getVariantStyles()}`}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : null}
                            {confirmText}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ConfirmationModal;
