import React, { useState, useEffect } from 'react';
import { Settings, Save, Check, Folder, Shield, Cpu } from 'lucide-react';
import { AppSettingsModel } from '@/types';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header Card */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs flex flex-row items-center justify-between">
        <div className="space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Settings className="h-7 w-7 text-foreground" /> Settings & Configuration
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage output paths, concurrency limits, and default download rules.
          </p>
        </div>

        {savedSuccess && (
          <span className="text-xs font-mono font-medium text-foreground bg-secondary border border-border px-4 py-2 rounded-full flex items-center gap-2 animate-in fade-in duration-200">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Directories */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-border/70 pb-4">
            <Folder className="h-5 w-5 text-foreground" />
            <h3 className="text-sm sm:text-base font-semibold uppercase tracking-wider text-foreground font-mono">
              Directories & Storage Paths
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
            <div className="space-y-1.5">
              <label className="block font-medium text-foreground">Output Media Directory</label>
              <Input
                type="text"
                name="outputDir"
                value={formData.outputDir}
                onChange={handleChange}
                className="font-mono h-11 text-xs bg-secondary/60 border-border"
              />
              <span className="text-xs text-muted-foreground block">Destination folder for videos</span>
            </div>

            <div className="space-y-1.5">
              <label className="block font-medium text-foreground">Data Storage Directory</label>
              <Input
                type="text"
                name="dataDir"
                value={formData.dataDir}
                onChange={handleChange}
                className="font-mono h-11 text-xs bg-secondary/60 border-border"
              />
              <span className="text-xs text-muted-foreground block">Stores channels, config & avatars</span>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="block font-medium text-foreground">Archive File Path</label>
              <Input
                type="text"
                name="archiveFile"
                value={formData.archiveFile}
                onChange={handleChange}
                className="font-mono h-11 text-xs bg-secondary/60 border-border"
              />
              <span className="text-xs text-muted-foreground block">yt-dlp download history archive</span>
            </div>
          </div>
        </div>

        {/* Default Rules */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-border/70 pb-4">
            <Shield className="h-5 w-5 text-foreground" />
            <h3 className="text-sm sm:text-base font-semibold uppercase tracking-wider text-foreground font-mono">
              Default Download Rules
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
            <div className="space-y-1.5">
              <label className="block font-medium text-foreground">Default Resolution Cap</label>
              <select
                name="defaultResolution"
                value={formData.defaultResolution}
                onChange={handleChange}
                className="w-full bg-secondary/60 border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:ring-1 focus:ring-ring"
              >
                <option value="1080">1080p (Full HD)</option>
                <option value="720">720p (HD)</option>
                <option value="4k">4K (2160p)</option>
                <option value="best">Best Available</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block font-medium text-foreground">Channel Sync Date Range (Days)</label>
              <Input
                type="number"
                name="daysLimit"
                value={formData.daysLimit}
                onChange={handleChange}
                min={1}
                max={365}
                className="h-11 text-sm bg-secondary/60 border-border"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-medium text-foreground">Subtitle Languages</label>
              <Input
                type="text"
                name="subtitleLangs"
                value={formData.subtitleLangs}
                onChange={handleChange}
                className="font-mono h-11 text-xs bg-secondary/60 border-border"
              />
              <span className="text-xs text-muted-foreground block">e.g. en.*,ta.* (English & Tamil)</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-secondary/60 rounded-2xl border border-border">
              <div>
                <span className="font-medium text-foreground block">Auto Embed Subtitles</span>
                <span className="text-xs text-muted-foreground">Download & embed SRT subtitles</span>
              </div>
              <input
                type="checkbox"
                name="includeSubtitles"
                checked={formData.includeSubtitles}
                onChange={handleChange}
                className="h-5 w-5 accent-foreground rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Concurrency */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-border/70 pb-4">
            <Cpu className="h-5 w-5 text-foreground" />
            <h3 className="text-sm sm:text-base font-semibold uppercase tracking-wider text-foreground font-mono">
              Concurrency & Performance
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
            <div className="space-y-1.5">
              <label className="block font-medium text-foreground">Max Concurrent Jobs</label>
              <Input
                type="number"
                name="maxConcurrentJobs"
                value={formData.maxConcurrentJobs}
                onChange={handleChange}
                min={1}
                max={20}
                className="h-11 text-sm bg-secondary/60 border-border"
              />
              <span className="text-xs text-muted-foreground block">Simultaneous channel/video download tasks</span>
            </div>

            <div className="space-y-1.5">
              <label className="block font-medium text-foreground">Concurrent Fragment Threads</label>
              <Input
                type="number"
                name="concurrentFragments"
                value={formData.concurrentFragments}
                onChange={handleChange}
                min={1}
                max={16}
                className="h-11 text-sm bg-secondary/60 border-border"
              />
              <span className="text-xs text-muted-foreground block">yt-dlp stream fragment download threads</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={isSaving}
            size="lg"
            className="h-12 px-8 text-sm sm:text-base font-semibold rounded-2xl gap-2.5"
          >
            <Save className="h-4 w-4" /> Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
}
