"use client";

import { useState } from "react";
import { Folder, ImageItem } from "@/types/database";
import { ImageCard } from "./ImageCard";
import { ImageUploadZone } from "./ImageUploadZone";
import { ImagePreviewModal } from "./ImagePreviewModal";
import { Search, Image as ImageIcon } from "lucide-react";

interface ImageGalleryProps {
  selectedFolder: Folder;
  images: ImageItem[];
  isLoading: boolean;
  onUploadImages: (files: File[]) => Promise<void>;
  onDeleteImage: (id: string, filePath: string) => Promise<void>;
  onToggleFavorite: (id: string, current: boolean) => Promise<void>;
}

export function ImageGallery({
  selectedFolder,
  images,
  isLoading,
  onUploadImages,
  onDeleteImage,
  onToggleFavorite,
}: ImageGalleryProps) {
  const [selectedPreview, setSelectedPreview] = useState<ImageItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // スター付きを最優先で先頭にソート
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_favorite && !b.is_favorite) return -1;
    if (!a.is_favorite && b.is_favorite) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const filteredImages = sortedImages.filter((img) =>
    img.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 space-y-6">
      {/* アップロードゾーン */}
      <ImageUploadZone
        folderName={selectedFolder.name}
        onUpload={onUploadImages}
      />

      {/* 検索・件数バー */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <p className="text-xs font-medium text-zinc-500">
          保存されている画像:{" "}
          <span className="font-bold text-zinc-800 dark:text-zinc-200">
            {images.length}
          </span>{" "}
          枚
          {images.some((img) => img.is_favorite) && (
            <span className="ml-2 text-amber-500 font-semibold">
              （★ {images.filter((img) => img.is_favorite).length} 件お気に入り）
            </span>
          )}
        </p>

        {images.length > 0 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ファイル名を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-40 sm:w-48 transition-all"
            />
          </div>
        )}
      </div>

      {/* 画像一覧グリッド */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center text-zinc-400 mb-3">
            <ImageIcon className="w-6 h-6" />
          </div>
          {searchQuery ? (
            <>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                一致する画像が見つかりませんでした
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                ファイル名を変えて検索してみてください
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                まだ画像が登録されていません
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                上の枠に画像ファイルをドロップすると、ここに保存・表示されます
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredImages.map((image) => (
            <ImageCard
              key={image.id}
              image={image}
              onPreview={(img) => setSelectedPreview(img)}
              onDelete={onDeleteImage}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}

      {/* 拡大プレビューモーダル */}
      <ImagePreviewModal
        image={selectedPreview}
        onClose={() => setSelectedPreview(null)}
      />
    </div>
  );
}
