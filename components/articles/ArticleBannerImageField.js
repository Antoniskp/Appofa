'use client';

import FormInput from '@/components/ui/FormInput';
import MediaAssetPicker from '@/components/media/MediaAssetPicker';

export default function ArticleBannerImageField({
  value,
  coverImageId,
  altText,
  caption,
  credit,
  onChange,
  canManageMedia = false,
  label,
  placeholder,
  uiText = {},
}) {
  const t = {
    upload: uiText.upload || 'Upload photo',
    uploading: uiText.uploading || 'Uploading...',
    refresh: uiText.refresh || 'Refresh library',
    loading: uiText.loading || 'Loading...',
    libraryError: uiText.libraryError || 'Could not load media library.',
    uploadError: uiText.uploadError || 'Could not upload image.',
    useImageTitle: uiText.useImageTitle || 'Use image',
    mediaImageAlt: uiText.mediaImageAlt || 'Media library image',
    previewAlt: uiText.previewAlt || 'Article banner preview',
    searchPlaceholder: uiText.searchPlaceholder || 'Search by name, alt, caption, credit, or tag',
    altLabel: uiText.altLabel || 'Image alt text',
    captionLabel: uiText.captionLabel || 'Caption',
    creditLabel: uiText.creditLabel || 'Credit',
    emptyLibrary: uiText.emptyLibrary || 'No media found for this search.',
    quotaStatus: uiText.quotaStatus || 'Storage usage',
    dropHint: uiText.dropHint || 'Drop or paste an image to upload',
  };

  const emitFieldChange = (name, nextValue, type = 'text') => {
    onChange({ target: { name, value: nextValue, type } });
  };

  const applyMediaAsset = (asset, articleCoverUrl) => {
    emitFieldChange('bannerImageUrl', articleCoverUrl || asset?.variants?.articleCover?.url || asset?.url || '');
    emitFieldChange('coverImageId', asset?.id ? String(asset.id) : '');
    emitFieldChange('bannerImageAltText', asset?.altText || '');
    emitFieldChange('bannerImageCaption', asset?.caption || '');
    emitFieldChange('bannerImageCredit', asset?.credit || '');
  };

  return (
    <div className="space-y-3">
      <FormInput
        name="bannerImageUrl"
        label={label}
        value={value}
        onChange={(event) => {
          emitFieldChange('coverImageId', '');
          onChange(event);
        }}
        placeholder={placeholder}
      />

      <input type="hidden" name="coverImageId" value={coverImageId || ''} readOnly />

      {value && (
        <div className="overflow-hidden rounded border border-gray-200 bg-gray-50">
          <img
            src={value}
            alt={altText || t.previewAlt}
            className="h-40 w-full object-cover"
          />
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FormInput
          name="bannerImageAltText"
          label={t.altLabel}
          value={altText || ''}
          onChange={onChange}
        />
        <FormInput
          name="bannerImageCaption"
          label={t.captionLabel}
          value={caption || ''}
          onChange={onChange}
        />
        <FormInput
          name="bannerImageCredit"
          label={t.creditLabel}
          value={credit || ''}
          onChange={onChange}
        />
      </div>

      <MediaAssetPicker
        canManageMedia={canManageMedia}
        selectedAssetId={coverImageId}
        onSelect={applyMediaAsset}
        selectVariant="articleCover"
        listParams={{ usageType: 'article_cover', shared: 'true' }}
        uploadFields={{
          usageType: 'article_cover',
          entityType: 'article',
          altText,
          caption,
          credit,
        }}
        uiText={t}
      />
    </div>
  );
}
