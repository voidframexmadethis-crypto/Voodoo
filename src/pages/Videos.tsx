import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Youtube, Plus, Trash2 } from 'lucide-react';
import { YouTubeVideo } from '../types';

export default function Videos() {
  const { state, addVideo, removeVideo } = useStore();
  const [newTitle, setNewTitle] = useState('');
  const [newVideoId, setNewVideoId] = useState('');

  const handleAddVideo = () => {
    if (!newTitle || !newVideoId) return;
    
    // Robust regex to extract YouTube ID
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]{11}).*/;
    const match = newVideoId.match(regExp);
    const finalVideoId = (match && match[2]) ? match[2] : newVideoId;

    const video: YouTubeVideo = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTitle,
      videoId: finalVideoId,
    };
    
    addVideo(video);
    setNewTitle('');
    setNewVideoId('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">YouTube Embeds</h1>
        <p className="text-neutral-400 mt-2">Manage your featured YouTube videos here.</p>
      </div>

      <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <Youtube className="w-5 h-5 mr-2 text-red-500" />
          Add New Video
        </h2>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-400 mb-1">Video Title</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-400 mb-1">YouTube URL or Video ID</label>
            <input
              type="text"
              value={newVideoId}
              onChange={(e) => setNewVideoId(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="flex items-end pb-0.5">
            <button
              onClick={handleAddVideo}
              className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.videos.length === 0 ? (
          <div className="col-span-full py-12 text-center text-neutral-500 border-2 border-dashed border-neutral-800 rounded-xl">
            No videos added yet. Add your first YouTube video above!
          </div>
        ) : (
          state.videos.map((video) => (
            <div key={video.id} className="bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 flex flex-col">
              <div className="relative pt-[56.25%] w-full bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${video.videoId}`}
                  title={video.title}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                ></iframe>
              </div>
              <div className="p-4 flex items-center justify-between">
                <h3 className="font-medium truncate pr-4">{video.title}</h3>
                <button
                  onClick={() => removeVideo(video.id)}
                  className="p-2 text-neutral-500 hover:text-red-400 transition-colors rounded-lg hover:bg-neutral-800 flex-shrink-0"
                  title="Remove video"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
