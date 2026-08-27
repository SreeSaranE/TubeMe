import React, { useState, useEffect } from 'react';
import { Save, Check, Folder, Sliders, Cpu } from 'lucide-react';
import { AppSettingsModel } from '@/types';
import { api } from '@/services/api';

interface SettingsTabProps {
  settings: AppSettingsModel | null;
  onSettingsSaved: (settings: AppSettingsModel) => void;
}

export function SettingsTab({ settings, onSettingsSaved }: SettingsTabProps) {
  const [formData, setFormData] = useState<AppSettingsModel>({
    outputDir: '/downloads',
    dataDir: '/app/data',
    archiveFile: '/app/data/archives.txt',
    channelsFile: '/app/data/channels.txt',
    defaultResolution: '1080',
    includeSubtitles: true,
    subtitleLangs: 'en.*,ta.*',
    daysLimit: 4,
    maxConcurrentJobs: 5,
    concurrentFragments: 4,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await api.saveSettings({
        ...formData,
        daysLimit: Number(formData.daysLimit),
        maxConcurrentJobs: Number(formData.maxConcurrentJobs),
        concurrentFragments: Number(formData.concurrentFragments),
      });
      onSettingsSaved(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Save settings error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. Clean, Spacious Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-[var(--border)] pb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Settings
        </h1>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <div className="status-chip connected animate-in fade-in">
              <Check className="h-4 w-4 mr-1" />
              <span>Saved successfully</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="btn btn-primary text-sm h-11 px-6 font-bold shadow-sm"
          >
            <Save className="h-4 w-4 mr-2" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* 2. Settings Sections Grid */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Storage Paths */}
          <div className="card p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-[var(--border)] pb-4">
              <Folder className="h-5 w-5 text-[var(--text-primary)]" />
              <h3 className="font-extrabold text-base sm:text-lg text-[var(--text-primary)]">
                Storage Directories
              </h3>
            </div>

            <div className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="font-bold text-[var(--text-primary)]">Download Directory</label>
                <input
                  type="text"
                  name="outputDir"
                  value={formData.outputDir}
                  onChange={handleChange}
                  className="w-full h-11 px-3.5 font-mono text-sm bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[var(--text-primary)]">Database & App Data</label>
                <input
                  type="text"
                  name="dataDir"
                  value={formData.dataDir}
                  onChange={handleChange}
                  className="w-full h-11 px-3.5 font-mono text-sm bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)]"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Quality & Subtitles */}
          <div className="card p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-[var(--border)] pb-4">
              <Sliders className="h-5 w-5 text-[var(--text-primary)]" />
              <h3 className="font-extrabold text-base sm:text-lg text-[var(--text-primary)]">
                Media & Quality Defaults
              </h3>
            </div>

            <div className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="font-bold text-[var(--text-primary)]">Default Resolution</label>
                <select
                  name="defaultResolution"
                  value={formData.defaultResolution}
                  onChange={handleChange}
                  className="w-full h-11 px-3.5 text-sm bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)]"
                >
                  <option value="1080">1080p Full HD</option>
                  <option value="720">720p HD</option>
                  <option value="4k">4K Ultra HD</option>
                  <option value="best">Best Available Video</option>
                  <option value="audio">Audio Only (MP3)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[var(--text-primary)]">Subtitle Languages</label>
                <input
                  type="text"
                  name="subtitleLangs"
                  value={formData.subtitleLangs}
                  onChange={handleChange}
                  placeholder="en.*,ta.*"
                  className="w-full h-11 px-3.5 font-mono text-sm bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)]"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border)]">
                <span className="font-bold text-[var(--text-primary)]">Embed Subtitles</span>
                <input
                  type="checkbox"
                  name="includeSubtitles"
                  checked={formData.includeSubtitles}
                  onChange={handleChange}
                  className="h-5 w-5 accent-[var(--primary)] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Concurrency & Scanning Limits */}
          <div className="card p-6 sm:p-8 space-y-5 md:col-span-2">
            <div className="flex items-center gap-2.5 border-b border-[var(--border)] pb-4">
              <Cpu className="h-5 w-5 text-[var(--text-primary)]" />
              <h3 className="font-extrabold text-base sm:text-lg text-[var(--text-primary)]">
                Concurrency & Engine Limits
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
              <div className="space-y-2">
                <label className="font-bold text-[var(--text-primary)]">Max Concurrent Jobs</label>
                <input
                  type="number"
                  name="maxConcurrentJobs"
                  min={1}
                  max={20}
                  value={formData.maxConcurrentJobs}
                  onChange={handleChange}
                  className="w-full h-11 px-3.5 font-mono text-sm bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)]"
                />
                <span className="text-xs text-[var(--text-muted)]">Parallel download tasks</span>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-[var(--text-primary)]">Concurrent Fragments</label>
                <input
                  type="number"
                  name="concurrentFragments"
                  min={1}
                  max={16}
                  value={formData.concurrentFragments}
                  onChange={handleChange}
                  className="w-full h-11 px-3.5 font-mono text-sm bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)]"
                />
                <span className="text-xs text-[var(--text-muted)]">Parallel video chunks per task</span>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-[var(--text-primary)]">Channel Sync Limit (Days)</label>
                <input
                  type="number"
                  name="daysLimit"
                  min={1}
                  max={365}
                  value={formData.daysLimit}
                  onChange={handleChange}
                  className="w-full h-11 px-3.5 font-mono text-sm bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)]"
                />
                <span className="text-xs text-[var(--text-muted)]">Skip channels if latest video is older</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-primary h-12 px-8 text-base font-bold shadow-sm"
          >
            <Save className="h-4.5 w-4.5 mr-2" />
            <span>{isSaving ? 'Saving Configurations...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
