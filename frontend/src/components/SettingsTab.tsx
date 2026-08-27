import React, { useState, useEffect } from 'react';
import {
  Save,
  Check,
  Folder,
  Sliders,
  Cpu,
  Sun,
  Moon,
  Laptop,
  Zap,
  Gauge,
  Leaf,
} from 'lucide-react';
import { AppSettingsModel } from '@/types';
import { api } from '@/services/api';
import { useTheme, ThemeMode } from '@/context/ThemeContext';

interface SettingsTabProps {
  settings: AppSettingsModel | null;
  onSettingsSaved: (settings: AppSettingsModel) => void;
}

export function SettingsTab({ settings, onSettingsSaved }: SettingsTabProps) {
  const { theme, setTheme } = useTheme();

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

    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
      return;
    }

    // Input limits validation
    if (name === 'maxConcurrentJobs') {
      const num = parseInt(value, 10);
      if (isNaN(num)) {
        setFormData((prev) => ({ ...prev, maxConcurrentJobs: 1 }));
      } else {
        setFormData((prev) => ({
          ...prev,
          maxConcurrentJobs: Math.min(20, Math.max(1, num)),
        }));
      }
      return;
    }

    if (name === 'concurrentFragments') {
      const num = parseInt(value, 10);
      if (isNaN(num)) {
        setFormData((prev) => ({ ...prev, concurrentFragments: 1 }));
      } else {
        setFormData((prev) => ({
          ...prev,
          concurrentFragments: Math.min(16, Math.max(1, num)),
        }));
      }
      return;
    }

    if (name === 'daysLimit') {
      const num = parseInt(value, 10);
      if (isNaN(num)) {
        setFormData((prev) => ({ ...prev, daysLimit: 1 }));
      } else {
        setFormData((prev) => ({
          ...prev,
          daysLimit: Math.min(365, Math.max(1, num)),
        }));
      }
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const applyConcurrencyPreset = (jobs: number, frags: number, days: number) => {
    setFormData((prev) => ({
      ...prev,
      maxConcurrentJobs: Math.min(20, Math.max(1, jobs)),
      concurrentFragments: Math.min(16, Math.max(1, frags)),
      daysLimit: Math.min(365, Math.max(1, days)),
    }));
  };

  // Determine which preset matches
  const isEcoPreset =
    formData.maxConcurrentJobs === 2 &&
    formData.concurrentFragments === 2 &&
    formData.daysLimit === 2;

  const isBalancedPreset =
    formData.maxConcurrentJobs === 5 &&
    formData.concurrentFragments === 4 &&
    formData.daysLimit === 4;

  const isTurboPreset =
    formData.maxConcurrentJobs === 10 &&
    formData.concurrentFragments === 8 &&
    formData.daysLimit === 7;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await api.saveSettings({
        ...formData,
        daysLimit: Math.min(365, Math.max(1, Number(formData.daysLimit))),
        maxConcurrentJobs: Math.min(20, Math.max(1, Number(formData.maxConcurrentJobs))),
        concurrentFragments: Math.min(16, Math.max(1, Number(formData.concurrentFragments))),
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

  const themeOptions: {
    mode: ThemeMode;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    desc: string;
  }[] = [
    {
      mode: 'light',
      label: 'Light',
      icon: Sun,
      desc: 'Crisp white canvas with dark contrast',
    },
    {
      mode: 'dark',
      label: 'Dark',
      icon: Moon,
      desc: 'Pitch black canvas for night focus',
    },
    {
      mode: 'system',
      label: 'System',
      icon: Laptop,
      desc: 'Automatically follows your OS preference',
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto w-full">
      {/* 1. Clean Header (Single Save button is at the bottom) */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-5">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
          Settings
        </h1>

        {savedSuccess && (
          <div className="status-chip connected animate-in fade-in text-xs font-medium">
            <Check className="h-4 w-4 mr-1" />
            <span>Saved successfully</span>
          </div>
        )}
      </div>

      {/* 2. Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Storage Paths */}
          <div className="card p-5 sm:p-8 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-[var(--border)] pb-4">
              <Folder className="h-5 w-5 text-[var(--text-primary)]" />
              <h3 className="font-semibold text-base sm:text-lg text-[var(--text-primary)]">
                Storage Directories
              </h3>
            </div>

            <div className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="font-medium text-[var(--text-primary)]">Download Directory</label>
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
          <div className="card p-5 sm:p-8 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-[var(--border)] pb-4">
              <Sliders className="h-5 w-5 text-[var(--text-primary)]" />
              <h3 className="font-semibold text-base sm:text-lg text-[var(--text-primary)]">
                Media & Quality Defaults
              </h3>
            </div>

            <div className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="font-medium text-[var(--text-primary)]">Default Resolution</label>
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
                <label className="font-medium text-[var(--text-primary)]">Subtitle Languages</label>
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
                <span className="font-medium text-[var(--text-primary)]">Embed Subtitles</span>
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

          {/* Card 3: Concurrency & Scanning Limits with Responsive Presets */}
          <div className="card p-5 sm:p-8 space-y-6 md:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-2.5">
                <Cpu className="h-5 w-5 text-[var(--text-primary)] shrink-0" />
                <h3 className="font-semibold text-base sm:text-lg text-[var(--text-primary)]">
                  Concurrency & Engine Limits
                </h3>
              </div>

              {/* 3 Quick Presets - Responsive alignment for mobile & desktop */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-medium text-[var(--text-muted)] shrink-0 hidden sm:inline">Presets:</span>
                <div className="grid grid-cols-3 gap-1.5 w-full sm:w-auto sm:flex sm:gap-2">
                  <button
                    type="button"
                    onClick={() => applyConcurrencyPreset(2, 2, 2)}
                    className={`py-2 sm:py-1.5 px-3 rounded-[var(--radius-sm)] text-xs font-medium border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isEcoPreset
                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
                        : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)]'
                    }`}
                    title="2 jobs, 2 fragments, 2 days"
                  >
                    <Leaf className="h-3.5 w-3.5 shrink-0" />
                    <span>Eco</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyConcurrencyPreset(5, 4, 4)}
                    className={`py-2 sm:py-1.5 px-3 rounded-[var(--radius-sm)] text-xs font-medium border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isBalancedPreset
                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
                        : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)]'
                    }`}
                    title="5 jobs, 4 fragments, 4 days (Default)"
                  >
                    <Gauge className="h-3.5 w-3.5 shrink-0" />
                    <span>Balanced</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyConcurrencyPreset(10, 8, 7)}
                    className={`py-2 sm:py-1.5 px-3 rounded-[var(--radius-sm)] text-xs font-medium border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isTurboPreset
                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
                        : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)]'
                    }`}
                    title="10 jobs, 8 fragments, 7 days"
                  >
                    <Zap className="h-3.5 w-3.5 shrink-0" />
                    <span>Turbo</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 text-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-[var(--text-primary)]">Max Concurrent Jobs</label>
                  <span className="text-[11px] font-mono text-[var(--text-muted)] font-medium">
                    [1 – 20]
                  </span>
                </div>
                <input
                  type="number"
                  name="maxConcurrentJobs"
                  min={1}
                  max={20}
                  value={formData.maxConcurrentJobs}
                  onChange={handleChange}
                  className="w-full h-11 px-3.5 font-mono text-sm bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                />
                <span className="text-xs text-[var(--text-muted)] block">
                  Parallel download tasks (Limit: 1 to 20)
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-[var(--text-primary)]">Concurrent Fragments</label>
                  <span className="text-[11px] font-mono text-[var(--text-muted)] font-medium">
                    [1 – 16]
                  </span>
                </div>
                <input
                  type="number"
                  name="concurrentFragments"
                  min={1}
                  max={16}
                  value={formData.concurrentFragments}
                  onChange={handleChange}
                  className="w-full h-11 px-3.5 font-mono text-sm bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                />
                <span className="text-xs text-[var(--text-muted)] block">
                  Parallel stream chunks (Limit: 1 to 16)
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-[var(--text-primary)]">Channel Sync Limit</label>
                  <span className="text-[11px] font-mono text-[var(--text-muted)] font-medium">
                    [1 – 365 days]
                  </span>
                </div>
                <input
                  type="number"
                  name="daysLimit"
                  min={1}
                  max={365}
                  value={formData.daysLimit}
                  onChange={handleChange}
                  className="w-full h-11 px-3.5 font-mono text-sm bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                />
                <span className="text-xs text-[var(--text-muted)] block">
                  Scan date horizon (Limit: 1 to 365 days)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Appearance & Theme Selector (Moved to Bottom) */}
        <div className="card p-5 sm:p-8 space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <div className="flex items-center gap-2.5">
              <Sun className="h-5 w-5 text-[var(--text-primary)]" />
              <h3 className="font-semibold text-base sm:text-lg text-[var(--text-primary)]">
                Appearance & Theme
              </h3>
            </div>
            <span className="type-pill font-mono">{theme}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.mode;

              return (
                <button
                  key={opt.mode}
                  type="button"
                  onClick={() => setTheme(opt.mode)}
                  className={`p-4 rounded-[var(--radius-md)] border-2 text-left transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'border-[var(--primary)] bg-[var(--bg-subtle)] shadow-xs'
                      : 'border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4.5 w-4.5 text-[var(--text-primary)]" />
                      <span className="font-medium text-sm text-[var(--text-primary)]">
                        {opt.label}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center">
                        <Check className="h-3 w-3 stroke-[2.5]" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {opt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Single Save Settings Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {savedSuccess ? (
            <div className="status-chip connected text-xs font-medium">
              <Check className="h-4 w-4 mr-1.5" />
              <span>Settings saved successfully!</span>
            </div>
          ) : (
            <div />
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto btn btn-primary h-11 px-8 text-sm sm:text-base font-medium shadow-sm"
          >
            <Save className="h-4.5 w-4.5 mr-2" />
            <span>{isSaving ? 'Saving Configurations...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
