import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { FeedPost, FeedCategory, FeedPostType } from '../../types';
import { 
  Plus, 
  Pin, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  Youtube, 
  Image as ImageIcon, 
  Music, 
  Package, 
  Megaphone, 
  FileText, 
  Check, 
  X, 
  Calendar,
  Heart,
  Share2,
  ExternalLink,
  Upload
} from 'lucide-react';

export default function FeedManagement() {
  const { state, addFeedPost, updateFeedPost, deleteFeedPost, togglePinFeedPost } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<FeedCategory>('ANNOUNCEMENTS');
  const [postType, setPostType] = useState<FeedPostType>('TEXT');
  const [imageUrl, setImageUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [featuredBeatId, setFeaturedBeatId] = useState('');
  const [featuredPackId, setFeaturedPackId] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setCategory('ANNOUNCEMENTS');
    setPostType('TEXT');
    setImageUrl('');
    setYoutubeUrl('');
    setFeaturedBeatId('');
    setFeaturedPackId('');
    setIsPinned(false);
    setIsPublished(true);
    setIsCreating(false);
    setEditingPostId(null);
  };

  const handleStartEdit = (post: FeedPost) => {
    setEditingPostId(post.id);
    setTitle(post.title || '');
    setContent(post.content);
    setCategory(post.category);
    setPostType(post.postType);
    setImageUrl(post.imageUrl || '');
    setYoutubeUrl(post.youtubeUrl || '');
    setFeaturedBeatId(post.featuredBeatId || '');
    setFeaturedPackId(post.featuredPackId || '');
    setIsPinned(post.isPinned || false);
    setIsPublished(post.isPublished !== false);
    setIsCreating(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload?type=image', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.fileUrl) {
        setImageUrl(data.fileUrl);
      }
    } catch (err) {
      console.error('Image upload failed:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const now = new Date().toISOString();

    if (editingPostId) {
      updateFeedPost(editingPostId, {
        title: title.trim() || undefined,
        content: content.trim(),
        category,
        postType,
        imageUrl: imageUrl.trim() || undefined,
        youtubeUrl: youtubeUrl.trim() || undefined,
        featuredBeatId: featuredBeatId || undefined,
        featuredPackId: featuredPackId || undefined,
        isPinned,
        isPublished,
      });
    } else {
      const newPost: FeedPost = {
        id: `feed_${Date.now()}`,
        title: title.trim() || undefined,
        content: content.trim(),
        category,
        postType,
        imageUrl: imageUrl.trim() || undefined,
        youtubeUrl: youtubeUrl.trim() || undefined,
        featuredBeatId: featuredBeatId || undefined,
        featuredPackId: featuredPackId || undefined,
        isPinned,
        isPublished,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
        likes: 0,
        shares: 0,
      };
      addFeedPost(newPost);
    }

    resetForm();
  };

  const getYoutubeVideoId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const posts = state.feedPosts || [];
  const sortedPosts = [...posts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime();
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-indigo-400" />
            Voodoo Boomin Feed Management
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Publish announcements, new beats, beat packs, photos, and YouTube videos directly to your storefront feed.
          </p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Create Real Post
          </button>
        )}
      </div>

      {/* Post Editor Form */}
      {isCreating && (
        <form 
          onSubmit={handleSubmit}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6 shadow-2xl"
        >
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <h3 className="text-lg font-bold text-white">
              {editingPostId ? 'Edit Feed Post' : 'Create Real Feed Post'}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category & Post Type */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FeedCategory)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL UPDATES">All Updates</option>
                <option value="ANNOUNCEMENTS">Announcements</option>
                <option value="NEW BEATS">New Beats</option>
                <option value="BEAT PACKS">Beat Packs</option>
                <option value="MEDIA">Media</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Post Type
              </label>
              <select
                value={postType}
                onChange={(e) => setPostType(e.target.value as FeedPostType)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="TEXT">Text Only</option>
                <option value="IMAGE">Image Post</option>
                <option value="YOUTUBE VIDEO">YouTube Video</option>
                <option value="BEAT">Featured Beat</option>
                <option value="BEAT PACK">Featured Beat Pack</option>
                <option value="ANNOUNCEMENT">Official Announcement</option>
              </select>
            </div>
          </div>

          {/* Post Title (Optional) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Post Title <span className="text-neutral-500 lowercase">(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. MEMORIAL DAY SALE — BUY 1 GET 2 FREE"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Post Content */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Content / Message <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share updates, upcoming projects, release notes, studio sessions, or special offers..."
              required
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 resize-y"
            />
          </div>

          {/* Conditional: Image Attachment */}
          {(postType === 'IMAGE' || postType === 'ANNOUNCEMENT' || postType === 'TEXT') && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Image Attachment (Upload or URL)
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium rounded-xl cursor-pointer transition-colors whitespace-nowrap">
                  <Upload className="w-4 h-4" />
                  {uploadingImage ? 'Uploading...' : 'Upload Image'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              {imageUrl && (
                <div className="mt-2 relative inline-block rounded-xl overflow-hidden border border-neutral-800 max-h-48">
                  <img src={imageUrl} alt="Preview" className="max-h-48 object-cover rounded-xl" />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute top-2 right-2 p-1 bg-black/70 hover:bg-black text-white rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Conditional: YouTube URL */}
          {(postType === 'YOUTUBE VIDEO' || postType === 'MEDIA') && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                YouTube Video URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-red-500">
                  <Youtube className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              {youtubeUrl && getYoutubeVideoId(youtubeUrl) && (
                <div className="mt-3 aspect-video w-full max-w-md rounded-xl overflow-hidden border border-neutral-800">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${getYoutubeVideoId(youtubeUrl)}`}
                    title="YouTube Video Preview"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          )}

          {/* Conditional: Featured Beat */}
          {(postType === 'BEAT' || postType === 'ALL UPDATES' || category === 'NEW BEATS') && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Attach Real Beat from Catalog
              </label>
              <select
                value={featuredBeatId}
                onChange={(e) => setFeaturedBeatId(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">None (Do not attach beat)</option>
                {state.beats.map((beat) => (
                  <option key={beat.id} value={beat.id}>
                    {beat.title} — ${beat.price || 35} ({beat.bpm || 140} BPM, {beat.key || 'C Min'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Conditional: Featured Beat Pack */}
          {(postType === 'BEAT PACK' || category === 'BEAT PACKS') && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Attach Real Beat Pack from Catalog
              </label>
              <select
                value={featuredPackId}
                onChange={(e) => setFeaturedPackId(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">None (Do not attach pack)</option>
                {state.beatPacks.map((pack) => (
                  <option key={pack.id} value={pack.id}>
                    {pack.title} — ${pack.price} ({pack.tracks?.length || 0} Tracks)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Toggles: Pin and Publish */}
          <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-neutral-800">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-neutral-950 border-neutral-800 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-white flex items-center gap-1.5">
                <Pin className={`w-3.5 h-3.5 ${isPinned ? 'text-amber-400' : 'text-neutral-400'}`} />
                Pin to top of feed
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-neutral-950 border-neutral-800 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-white flex items-center gap-1.5">
                {isPublished ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-neutral-400" />}
                {isPublished ? 'Published (Visible to Store)' : 'Draft (Hidden)'}
              </span>
            </label>
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2.5 text-sm font-medium text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
            >
              {editingPostId ? 'Save Changes' : 'Publish to Feed'}
            </button>
          </div>
        </form>
      )}

      {/* Posts List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            Published Feed Posts ({posts.length})
          </h3>
        </div>

        {posts.length === 0 ? (
          <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-12 text-center">
            <Megaphone className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <p className="text-base font-medium text-neutral-300">No updates yet.</p>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              You haven't created any feed posts yet. Use the "Create Real Post" button above to publish your first announcement.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {sortedPosts.map((post) => {
              const featuredBeat = state.beats.find((b) => b.id === post.featuredBeatId);
              const featuredPack = state.beatPacks.find((p) => p.id === post.featuredPackId);

              return (
                <div
                  key={post.id}
                  className={`bg-neutral-900/80 border rounded-2xl p-5 transition-all ${
                    post.isPinned ? 'border-amber-500/40 bg-amber-950/10' : 'border-neutral-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {post.isPinned && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                            <Pin className="w-3 h-3" /> Pinned
                          </span>
                        )}
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
                          {post.category}
                        </span>
                        <span className="text-[11px] font-medium text-neutral-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.publishedAt || post.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        {post.isPublished === false && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            Draft
                          </span>
                        )}
                      </div>

                      {post.title && (
                        <h4 className="text-base font-bold text-white">{post.title}</h4>
                      )}

                      <p className="text-sm text-neutral-300 whitespace-pre-line line-clamp-3">
                        {post.content}
                      </p>

                      {/* Attachments preview */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {post.imageUrl && (
                          <span className="inline-flex items-center gap-1 text-xs text-neutral-400 bg-neutral-800/80 px-2.5 py-1 rounded-lg">
                            <ImageIcon className="w-3.5 h-3.5 text-indigo-400" /> Image Attached
                          </span>
                        )}
                        {post.youtubeUrl && (
                          <span className="inline-flex items-center gap-1 text-xs text-neutral-400 bg-neutral-800/80 px-2.5 py-1 rounded-lg">
                            <Youtube className="w-3.5 h-3.5 text-red-500" /> YouTube Video Attached
                          </span>
                        )}
                        {featuredBeat && (
                          <span className="inline-flex items-center gap-1 text-xs text-neutral-400 bg-neutral-800/80 px-2.5 py-1 rounded-lg">
                            <Music className="w-3.5 h-3.5 text-emerald-400" /> Beat: {featuredBeat.title}
                          </span>
                        )}
                        {featuredPack && (
                          <span className="inline-flex items-center gap-1 text-xs text-neutral-400 bg-neutral-800/80 px-2.5 py-1 rounded-lg">
                            <Package className="w-3.5 h-3.5 text-purple-400" /> Pack: {featuredPack.title}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2 self-end sm:self-start">
                      <button
                        onClick={() => togglePinFeedPost(post.id)}
                        title={post.isPinned ? "Unpin post" : "Pin post to top"}
                        className={`p-2 rounded-xl transition-colors ${
                          post.isPinned 
                            ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' 
                            : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'
                        }`}
                      >
                        <Pin className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => updateFeedPost(post.id, { isPublished: !post.isPublished })}
                        title={post.isPublished ? "Unpublish post" : "Publish post"}
                        className={`p-2 rounded-xl transition-colors ${
                          post.isPublished 
                            ? 'bg-neutral-800 text-emerald-400 hover:bg-neutral-700' 
                            : 'bg-neutral-800 text-neutral-500 hover:text-white hover:bg-neutral-700'
                        }`}
                      >
                        {post.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => handleStartEdit(post)}
                        title="Edit post"
                        className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-xl transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this real feed post?')) {
                            deleteFeedPost(post.id);
                          }
                        }}
                        title="Delete post"
                        className="p-2 bg-neutral-800 hover:bg-rose-950/40 text-neutral-400 hover:text-rose-400 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
