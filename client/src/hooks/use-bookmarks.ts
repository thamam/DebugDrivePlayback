/**
 * Bookmarks Hook - Manages bookmark functionality
 * Simplified from the massive use-debug-player hook
 */
import { useState } from 'react';
import { mockBookmarks, mockPlugins } from '@/lib/mock-data';
import { Bookmark, Plugin } from '@shared/schema';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(mockBookmarks);
  const [plugins, setPlugins] = useState<Plugin[]>(mockPlugins);

  const addBookmark = (currentTime: number) => {
    const newBookmark: Bookmark = {
      id: Date.now(),
      sessionId: 1,
      timestamp: currentTime,
      label: `Bookmark ${bookmarks.length + 1}`,
      color: '#4a9eff'
    };
    setBookmarks(prev => [...prev, newBookmark]);
  };

  return {
    bookmarks,
    plugins,
    addBookmark
  };
}
