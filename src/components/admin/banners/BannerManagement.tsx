"use client";

import React from "react";
import { 
  Plus, 
  Search, 
  ImageIcon as ImageIconLucide, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  Loader2, 
  ArrowUpRight 
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bannersApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { StoryImage } from "@/components/StoryImage";
import BannerForm from "./BannerForm";
import ConfirmationModal from "@/components/admin/shared/ConfirmationModal";

export default function BannerManagement() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedBanner, setSelectedBanner] = React.useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [bannerToDelete, setBannerToDelete] = React.useState<any>(null);

  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["banners"],
    queryFn: () => bannersApi.getBanners(),
  });

  const banners = Array.isArray(data) ? data : [];

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      bannersApi.updateBanner(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bannersApi.deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      setIsDeleteModalOpen(false);
      setBannerToDelete(null);
    },
  });

  const filteredBanners = (banners || []).filter((b) =>
    b && (
      (b.position?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (b.linkUrl?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    )
  );

  const handleEdit = (banner: any) => {
    setSelectedBanner(banner);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedBanner(null);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (banner: any) => {
    setBannerToDelete(banner);
    setIsDeleteModalOpen(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="space-y-8 min-h-screen pb-20">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Ad <span className="text-[#ff4500]">Banners</span>
        </h1>
        <p className="text-gray-500 font-medium text-lg">
          Manage visual advertisements and banner placements across your site.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 flex flex-col lg:flex-row items-stretch lg:items-center gap-4 sticky top-4 z-10">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
          <Input
            type="text"
            placeholder="Search by position or link..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 w-full pl-12 pr-4 rounded-2xl bg-gray-50/50 border-gray-100 text-sm focus-visible:ring-orange-500/20 focus-visible:border-orange-200"
          />
        </div>

        <Button
          onClick={handleCreate}
          className="h-12 px-8 rounded-2xl bg-[#ff4500] hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/20 transition-all"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Banner
        </Button>
      </div>

      {/* Grid of Banners */}
      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
          <p className="text-gray-500 font-bold">Loading advertisements...</p>
        </div>
      ) : isError ? (
        <div className="py-32 flex flex-col items-center justify-center bg-red-50 rounded-[3rem] border-2 border-dashed border-red-100 text-red-500">
          <p className="font-bold text-lg">Failed to load banners.</p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {filteredBanners.map((banner) => {
            if (!banner) return null;
            return (
            <motion.div
              key={banner.id}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className={`group relative bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border ${
                banner.isActive ? "border-gray-100" : "border-gray-200 bg-gray-50/50 opacity-75"
              }`}
            >
              <div className="aspect-[3/1] relative overflow-hidden bg-gray-50 flex-shrink-0">
                {banner.imageUrl && banner.imageUrl.trim().length > 0 ? (
                  <StoryImage
                    src={banner.imageUrl}
                    alt={banner.altText || "Banner"}
                    fill
                    sizes="(max-width: 768px) 100vw, 512px"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    variant="featured"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#7c7fff]">
                    <span className="text-xl font-black text-white tracking-widest opacity-80 uppercase selection:bg-none">
                      Banner Preview
                    </span>
                  </div>
                )}
                {!banner.isActive && (
                  <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="bg-white/10 border border-white/20 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                      Inactive
                    </span>
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="bg-gray-900/40 backdrop-blur-md text-[10px] text-white px-3 py-1 rounded-lg font-black uppercase tracking-widest border border-white/10">
                    {banner.position.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div className="p-6 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-black text-gray-900 truncate">
                      {banner.linkUrl}
                    </span>
                    <a
                      href={banner.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-orange-500 transition-colors"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </a>
                  </div>
                  <p className="text-xs text-gray-400 font-medium truncate">
                    {banner.altText || "No description provided"}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleMutation.mutate({ id: banner.id, isActive: !banner.isActive })}
                    title={banner.isActive ? "Deactivate" : "Activate"}
                    className={`rounded-xl transition-all ${
                      banner.isActive ? "text-orange-500 bg-orange-50" : "text-gray-400 bg-gray-100"
                    }`}
                  >
                    {banner.isActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(banner)}
                    className="rounded-xl text-blue-500 bg-blue-50 hover:bg-blue-100"
                  >
                    <Edit3 className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(banner)}
                    className="rounded-xl text-red-500 bg-red-50 hover:bg-red-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          );
          })}

          {filteredBanners.length === 0 && (
            <div className="col-span-full py-32 flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
              <ImageIconLucide className="w-12 h-12 text-gray-200 mb-4" />
              <p className="text-gray-400 font-bold text-lg">No banners found.</p>
              <Button
                variant="link"
                onClick={handleCreate}
                className="text-orange-500 font-black uppercase tracking-widest text-xs mt-2"
              >
                Create your first banner
              </Button>
            </div>
          )}
        </motion.div>
      )}

      <BannerForm
        key={isFormOpen ? `banner-form-${selectedBanner?.id || 'new'}` : 'closed'}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        banner={selectedBanner}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={() => {
          if (bannerToDelete?.id) {
            deleteMutation.mutate(bannerToDelete.id);
          }
        }}
        title="Delete Banner?"
        description="This action cannot be undone. This advertisement will no longer be displayed on your site."
        confirmText="Yes, Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
