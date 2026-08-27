import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MediaVideoItem } from '@/types';
import { api } from '@/services/api';
import { HomeHeader } from './home/HomeHeader';
import { HomeFilters } from './home/HomeFilters';
import { VideoCard } from './home/VideoCard';
import { HomeEmptyState } from './home/HomeEmptyState';

export function HomeTab() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<MediaVideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'size' | 'title'>('newest');

  const loadVideos = async () => {
    setIsLoading(true);
    try {
      const data = await api.getVideos();
      setVideos(data || []);
    } catch (err) {
      console.error('Failed to load downloaded videos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  // Unique list of channels from downloaded videos
  const channelList = useMemo(() => {
    const set = new Set<string>();
    videos.forEach((v) => {
      if (v.channelName) set.add(v.channelName);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [videos]);

  // Filter & Sort
  const filteredVideos = useMemo(() => {
    return videos
      .filter((video) => {
        const matchesChannel =
          selectedChannel === 'All' ||
          video.channelName.toLowerCase() === selectedChannel.toLowerCase();

        const query = searchQuery.trim().toLowerCase();
        const matchesQuery =
          !query ||
          video.title.toLowerCase().includes(query) ||
          video.channelName.toLowerCase().includes(query);

        return matchesChannel && matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
        }
        if (sortBy === 'size') {
          return b.size - a.size;
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [videos, selectedChannel, searchQuery, sortBy]);

  return (
    <div className="space-y-7">
      {/* 1. Header Row */}
      <HomeHeader
        videoCount={videos.length}
        isLoading={isLoading}
        onRefresh={loadVideos}
      />

      {/* 2. Search & Channel Filter Bar */}
      {videos.length > 0 && (
        <HomeFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          channelList={channelList}
          selectedChannel={selectedChannel}
          onChannelSelect={setSelectedChannel}
          videos={videos}
        />
      )}

      {/* 3. YouTube-Style Video Grid (3 videos per row) */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3 animate-pulse">
              <div className="aspect-video w-full rounded-[var(--radius-md)] bg-[var(--bg-subtle)]" />
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[var(--bg-subtle)] rounded w-5/6" />
                  <div className="h-3 bg-[var(--bg-subtle)] rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredVideos.length === 0 ? (
        <HomeEmptyState
          searchQuery={searchQuery}
          selectedChannel={selectedChannel}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onClick={() => navigate(`/watch?path=${encodeURIComponent(video.relativePath)}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
