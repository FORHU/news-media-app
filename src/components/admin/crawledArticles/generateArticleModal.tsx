import React from 'react';
import {
    Zap,
    Loader2,
    X
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
    Select, 
    SelectContent, 
    SelectGroup, 
    SelectItem, 
    SelectLabel, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { articlesApi } from '@/lib/api';
import { CATEGORY_HIERARCHY } from '@/lib/taxonomy';

interface GenerateArticleModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onGenerate: (prompt: string, categoryId: string) => void;
    isPending: boolean;
}

const GENERATION_PROMPT_MAX_LEN = 4000;

export default function GenerateArticleModal({
    open,
    onOpenChange,
    onGenerate,
    isPending
}: GenerateArticleModalProps) {
    const [generationPrompt, setGenerationPrompt] = React.useState('');
    const [selectedCategory, setSelectedCategory] = React.useState<string>('');
    const [error, setError] = React.useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = React.useState<{ category?: string }>({});

    // Reset when opening
    React.useEffect(() => {
        if (open) {
            setGenerationPrompt('');
            setSelectedCategory('');
            setError(null);
            setFieldErrors({});
        }
    }, [open]);

    const handleCategoryChange = (val: string) => {
        setSelectedCategory(val);
        setFieldErrors(prev => ({ ...prev, category: undefined }));
    };

    // Fetch categories
    const { data: categories, isLoading: isLoadingCategories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => articlesApi.getCategories(),
        enabled: open
    });

    // Filter categories into groups
    const groupedCategories = CATEGORY_HIERARCHY.map(group => ({
        label: group.label,
        items: categories?.filter(cat => 
            group.subcategories.some(sub => sub.toLowerCase() === cat.name.toLowerCase())
        ) ?? []
    })).filter(group => group.items.length > 0);

    const handleGenerate = () => {
        if (!selectedCategory) {
            setFieldErrors({ category: "Please select a category first" });
            return;
        }
        onGenerate(generationPrompt, selectedCategory);
        onOpenChange(false);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent className="sm:max-w-xl p-0 overflow-hidden rounded-[2.5rem] border-none bg-white shadow-2xl">
                <div className="relative bg-gray-900 px-8 py-10 overflow-hidden">
                    <button 
                        onClick={() => onOpenChange(false)}
                        className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 hover:scale-110 active:scale-95 transition-all z-20 group"
                    >
                        <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                    </button>

                    <div className="relative flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <Zap className="w-7 h-7 text-white fill-white/20" />
                        </div>
                        <div className="space-y-1">
                            <DialogTitle className="text-2xl font-black text-white tracking-tight">
                                Generate Article
                            </DialogTitle>
                            <DialogDescription className="text-gray-400 font-medium">
                                Refine your story before the AI brings it to life.
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <div className="px-8 py-8 space-y-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                           {error}
                        </div>
                    )}

                    {/* Category Selection - Now Required */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-black text-xs">01</span>
                            <label className="text-sm font-black uppercase tracking-widest text-gray-900">Select Category <span className="text-red-500">*</span></label>
                        </div>
                        
                        <div className="space-y-2">
                            <Select value={selectedCategory} onValueChange={handleCategoryChange} disabled={isLoadingCategories}>
                                <SelectTrigger className={`w-full h-14 rounded-2xl bg-gray-50 text-base font-bold text-gray-900 focus-visible:ring-orange-500/20 shadow-sm transition-all ${
                                    fieldErrors.category ? "border-red-500 bg-red-50/30" : "border-gray-100"
                                }`}>
                                    <SelectValue placeholder="Which category does this belong to?" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[400px]">
                                    {groupedCategories.map((group) => (
                                        <SelectGroup key={group.label}>
                                            <SelectLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff4500] px-4 py-2 mt-2 border-b border-gray-50">
                                                {group.label}
                                            </SelectLabel>
                                            {group.items.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id} className="pl-6 font-semibold">
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    ))}
                                </SelectContent>
                            </Select>
                            {fieldErrors.category && (
                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1 animate-in fade-in slide-in-from-top-1">{fieldErrors.category}</p>
                            )}
                        </div>
                    </div>

                    {/* Writing Instructions */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-black text-xs">02</span>
                            <label className="text-sm font-black uppercase tracking-widest text-gray-900">Writing Instructions</label>
                        </div>
                        <div className="space-y-2">
                            <Textarea
                                value={generationPrompt}
                                onChange={(e) =>
                                    setGenerationPrompt(
                                        e.target.value.slice(0, GENERATION_PROMPT_MAX_LEN)
                                    )
                                }
                                placeholder="Lead with the policy impact, keep it under 400 words, neutral AP style…"
                                className="min-h-[140px] rounded-2xl bg-gray-50 border-gray-100 p-4 text-base font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 resize-none transition-all"
                                disabled={isPending}
                            />
                            <div className="flex justify-end">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest tabular-nums">
                                    {generationPrompt.length} / {GENERATION_PROMPT_MAX_LEN} chars
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex flex-row items-center justify-between gap-4">
                    <div className="flex-1 flex justify-start">
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-6 h-12"
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                    </div>
                    <Button
                        onClick={handleGenerate}
                        disabled={isPending || !selectedCategory}
                        className="flex-1 max-w-[200px] h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black text-base shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all"
                    >
                        {isPending ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Generating...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Zap className="w-5 h-5 fill-white" />
                                <span>Generate</span>
                            </div>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
