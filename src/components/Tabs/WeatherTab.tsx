import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CloudSun,
  Droplets,
  Wind,
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Thermometer,
  Search,
  MapPin,
  X,
  Navigation,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { BOUNCY_SPRING } from '../../theme';
import { useApp } from '../../context/AppContext';
import {
  fetchHourlyForecast,
  scanBestSprayWindow,
  DEFAULT_FALLBACK_LOCATION,
  INDIAN_AGRICULTURAL_HUBS,
  searchLocations,
  GeoLocationResult,
  HourlyForecastPoint,
  formatRainProb,
  getStoredLocation,
  saveStoredLocation,
  MAX_SPRAY_WIND_KMH,
  MAX_SPRAY_RAIN_PROB_PCT,
  MAX_SPRAY_TEMP_C,
} from '../../utils/weather';
import { EvaluatedSprayWindow, SprayWindowHour, DailyForecastPoint } from '../../types';

export const WeatherTab: React.FC = () => {
  const {
    language,
    latestDiagnosis,
    evaluatedSprayWindow,
    setEvaluatedSprayWindow,
    weather,
    setWeather,
    openChatWithPrompt,
  } = useApp();

  const [isLoading, setIsLoading] = useState<boolean>(!evaluatedSprayWindow);
  const [activeSegment, setActiveSegment] = useState<'spray' | 'risk' | 'forecast'>('spray');
  const [selectedHour, setSelectedHour] = useState<SprayWindowHour | null>(null);
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<GeoLocationResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showWhyRules, setShowWhyRules] = useState<boolean>(false);

  // Initialize location from storage or default
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    name: string;
  }>(() => {
    return getStoredLocation() || DEFAULT_FALLBACK_LOCATION;
  });

  const loadWeather = async (lat: number, lon: number, locName: string) => {
    setIsLoading(true);
    try {
      const data = await fetchHourlyForecast(lat, lon);
      setWeather(data.current);
      const windowEvaluation = scanBestSprayWindow(
        data.hourly,
        latestDiagnosis?.conditionName,
        locName,
        new Date(),
        data.dailyForecast
      );
      setEvaluatedSprayWindow(windowEvaluation);

      if (windowEvaluation.hourlyTimeline.length > 0) {
        const bestHour =
          windowEvaluation.hourlyTimeline.find((h) => h.inBestWindow) ||
          windowEvaluation.hourlyTimeline[0];
        setSelectedHour(bestHour);
      }
    } catch (err) {
      console.error('Failed to load weather forecast:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-detect geolocation or saved location on mount, plus 30-min auto-refresh
  useEffect(() => {
    const saved = getStoredLocation();
    if (saved) {
      setCurrentLocation(saved);
      loadWeather(saved.latitude, saved.longitude, saved.name);
    } else if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const loc = {
            latitude: lat,
            longitude: lon,
            name: `Detected Field (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
          };
          setCurrentLocation(loc);
          saveStoredLocation(loc);
          loadWeather(lat, lon, loc.name);
        },
        () => {
          // Fallback to default
          loadWeather(
            DEFAULT_FALLBACK_LOCATION.latitude,
            DEFAULT_FALLBACK_LOCATION.longitude,
            DEFAULT_FALLBACK_LOCATION.name
          );
        },
        { timeout: 7000 }
      );
    } else {
      loadWeather(
        DEFAULT_FALLBACK_LOCATION.latitude,
        DEFAULT_FALLBACK_LOCATION.longitude,
        DEFAULT_FALLBACK_LOCATION.name
      );
    }

    // Auto-refresh weather every 30 minutes (1,800,000 ms)
    const interval = setInterval(() => {
      const loc = getStoredLocation() || DEFAULT_FALLBACK_LOCATION;
      loadWeather(loc.latitude, loc.longitude, loc.name);
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [latestDiagnosis?.conditionName]);

  const handleSelectLocation = (lat: number, lon: number, name: string) => {
    const loc = { latitude: lat, longitude: lon, name };
    setCurrentLocation(loc);
    saveStoredLocation(loc);
    setShowLocationModal(false);
    setSearchQuery('');
    setSearchResults([]);
    loadWeather(lat, lon, name);
  };

  const handleGpsDetect = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const locName = `Current Field (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
          handleSelectLocation(lat, lon, locName);
        },
        () => {
          alert('GPS location permission denied or unavailable on this device.');
        },
        { timeout: 8000 }
      );
    }
  };

  const handleSearchInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim().length >= 2) {
      setIsSearching(true);
      const res = await searchLocations(query);
      setSearchResults(res);
      setIsSearching(false);
    } else {
      setSearchResults([]);
    }
  };

  // Weather verdict tone styling
  const isOptimal = evaluatedSprayWindow?.status === 'optimal';
  const isModerate = evaluatedSprayWindow?.status === 'moderate';
  const isPoor = evaluatedSprayWindow?.status === 'poor';

  // Ambient radial background for primary hero card
  const heroGradient = isOptimal
    ? 'radial-gradient(ellipse at top right, rgba(52, 121, 110, 0.18), transparent 70%)'
    : isModerate
    ? 'radial-gradient(ellipse at top right, rgba(192, 119, 44, 0.18), transparent 70%)'
    : 'radial-gradient(ellipse at top right, rgba(168, 66, 63, 0.18), transparent 70%)';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 relative">
      {/* Location Picker Modal / Popover */}
      <AnimatePresence>
        {showLocationModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLocationModal(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={BOUNCY_SPRING}
              className="fixed top-20 left-4 right-4 sm:left-auto sm:right-auto sm:w-[460px] mx-auto z-50 rounded-3xl border border-[var(--glass-border)] bg-[var(--surface-glass-elevated)] backdrop-blur-2xl shadow-[var(--glass-shadow-elevated)] p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[var(--primary-accent)]" />
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Select Field Location
                  </h3>
                </div>
                <button
                  onClick={() => setShowLocationModal(false)}
                  className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                  aria-label="Close location picker"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* GPS button */}
              <button
                onClick={handleGpsDetect}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-glass)] text-xs font-semibold text-[var(--primary-accent)] hover:bg-[var(--surface-glass-elevated)] cursor-pointer shadow-2xs transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Use Current Device GPS</span>
              </button>

              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInput}
                  placeholder="Search any district, city, or village..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--glass-border)] bg-[var(--surface-glass)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-accent)]/40"
                  autoFocus
                />
              </div>

              {/* Search results or hubs list */}
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {isSearching ? (
                  <div className="text-xs text-[var(--text-secondary)] text-center py-4">
                    Searching global geocoding directory...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((res) => (
                    <button
                      key={res.id}
                      onClick={() =>
                        handleSelectLocation(
                          res.latitude,
                          res.longitude,
                          `${res.name}${res.admin1 ? `, ${res.admin1}` : ''}`
                        )
                      }
                      className="w-full text-left p-2.5 rounded-xl border border-[var(--glass-border-subtle)] hover:border-[var(--primary-accent)] hover:bg-[var(--surface-glass)] transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-semibold text-[var(--text-primary)]">
                        {res.name}
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)]">
                        {[res.admin1, res.country].filter(Boolean).join(', ')} (
                        {res.latitude.toFixed(2)}°, {res.longitude.toFixed(2)}°)
                      </div>
                    </button>
                  ))
                ) : (
                  <>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)] px-1 pt-1 pb-1">
                      Major Agricultural Hubs
                    </div>
                    {INDIAN_AGRICULTURAL_HUBS.map((hub) => (
                      <button
                        key={hub.name}
                        onClick={() =>
                          handleSelectLocation(hub.latitude, hub.longitude, hub.name)
                        }
                        className="w-full text-left p-2 rounded-xl hover:bg-[var(--surface-glass)] transition-colors cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-semibold text-[var(--text-primary)]">
                            {hub.name}
                          </div>
                          <div className="text-[10px] text-[var(--text-secondary)]">
                            {hub.detail}
                          </div>
                        </div>
                        <span className="text-[10px] text-[var(--primary-accent)]">Select</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* A. Location & Conditions Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={BOUNCY_SPRING}
        className="flex items-center justify-between flex-wrap gap-2 pt-1"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Weather
          </h1>
        </div>

        {/* Compact Tappable Location Pill */}
        <button
          onClick={() => setShowLocationModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--glass-border)] bg-[var(--surface-glass)] hover:bg-[var(--surface-glass-elevated)] backdrop-blur-md text-xs font-semibold text-[var(--text-primary)] cursor-pointer shadow-2xs transition-all hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-accent)]"
          title="Change location"
        >
          <MapPin className="w-3.5 h-3.5 text-[var(--primary-accent)] shrink-0" />
          <span className="truncate max-w-[220px]">{currentLocation.name}</span>
          <ChevronDown className="w-3 h-3 text-[var(--text-secondary)] opacity-70" />
        </button>
      </motion.div>

      {/* B. Primary Decision Card — Liquid Glass Hero */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={BOUNCY_SPRING}
        style={{ backgroundImage: heroGradient }}
        className="sylva-card-elevated p-6 sm:p-7 relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            {/* Context tag if active diagnosis exists */}
            {latestDiagnosis && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--primary-accent)]/15 border border-[var(--primary-accent)]/30 text-xs font-semibold text-[var(--primary-accent)]">
                <Sparkles className="w-3 h-3" />
                <span>
                  For your {latestDiagnosis.cropName} · {latestDiagnosis.conditionName}
                </span>
              </div>
            )}

            {/* Plain-Language Verdict */}
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Agronomic Verdict
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] leading-snug">
                {isLoading
                  ? 'Calculating optimal microclimate spray window...'
                  : evaluatedSprayWindow?.plainVerdict ||
                    'Good conditions for standard foliar applications.'}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-xl leading-relaxed">
              {evaluatedSprayWindow?.bestWindowReason ||
                'Scanned next 48 hours for calm wind (< 15 km/h) and zero wash-off risk.'}
            </p>
          </div>

          {/* Current Temperature & Icon */}
          <div className="shrink-0 flex items-center sm:flex-col sm:items-end gap-3 sm:gap-1 p-3 sm:p-0 rounded-2xl bg-[var(--surface-glass)] sm:bg-transparent border sm:border-0 border-[var(--glass-border)]">
            <div className="w-12 h-12 rounded-2xl bg-[var(--primary-accent)]/15 text-[var(--primary-accent)] flex items-center justify-center">
              <CloudSun className="w-7 h-7" />
            </div>
            <div className="tabular-nums font-bold text-3xl sm:text-4xl text-[var(--text-primary)]">
              {weather ? `${Math.round(weather.temperatureC)}°C` : '26°C'}
            </div>
            <div className="text-xs text-[var(--text-secondary)]">
              {weather?.condition || 'Partly Cloudy'}
            </div>
          </div>
        </div>

        {/* Compact Essential Readings Row */}
        <div className="mt-6 pt-5 border-t border-[var(--glass-border-subtle)] grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
              <Droplets className="w-3.5 h-3.5 text-[var(--primary-accent)]" />
              <span>Humidity</span>
            </div>
            <div className="tabular-nums font-bold text-base sm:text-lg text-[var(--text-primary)]">
              {weather ? `${weather.humidityPct}%` : '68%'}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
              <Wind className="w-3.5 h-3.5 text-[var(--primary-accent)]" />
              <span>Wind Speed</span>
            </div>
            <div className="tabular-nums font-bold text-base sm:text-lg text-[var(--text-primary)]">
              {weather ? `${weather.windSpeedKmh} km/h` : '9 km/h'}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
              <CloudSun className="w-3.5 h-3.5 text-[var(--primary-accent)]" />
              <span>Rain Chance</span>
            </div>
            <div className="tabular-nums font-bold text-base sm:text-lg text-[var(--text-primary)]">
              {evaluatedSprayWindow?.hourlyTimeline[0]
                ? formatRainProb(evaluatedSprayWindow.hourlyTimeline[0].rainProb)
                : 'No rain expected'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* C. Detail Section — Segmented Control */}
      <div className="space-y-4">
        {/* Clean Segmented Tab Control with Thin Underline */}
        <div className="flex items-center border-b border-[var(--glass-border-subtle)] gap-2">
          {[
            { id: 'spray', label: 'Spray timing' },
            { id: 'risk', label: 'Disease risk' },
            { id: 'forecast', label: 'Forecast' },
          ].map((tab) => {
            const isActive = activeSegment === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSegment(tab.id as any)}
                className={`relative pb-3 px-3 text-sm font-semibold cursor-pointer transition-colors ${
                  isActive
                    ? 'text-[var(--primary-accent)] font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="weatherSegmentUnderline"
                    transition={BOUNCY_SPRING}
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary-accent)] rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Spray Timing (Default) */}
        {activeSegment === 'spray' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={BOUNCY_SPRING}
            className="space-y-4"
          >
            {/* 24-Hour Continuous Hourly Suitability Strip */}
            <div className="sylva-card p-5 space-y-3.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--primary-accent)]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    24-Hour Suitability Strip (From Current Hour)
                  </h3>
                </div>

                {/* 3-Dot Key */}
                <div className="flex items-center gap-3 text-[11px] text-[var(--text-secondary)] font-medium">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[var(--status-good)]" />
                    <span>Good</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[var(--status-marginal)]" />
                    <span>Marginal</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[var(--status-poor)]" />
                    <span>Poor</span>
                  </span>
                </div>
              </div>

              {/* The Single Continuous 24-hour Strip */}
              <div className="relative pt-2 pb-1">
                <div className="grid grid-cols-12 sm:grid-cols-24 gap-1 h-9 rounded-xl overflow-hidden p-1 bg-[var(--surface-glass-elevated)] border border-[var(--glass-border)]">
                  {evaluatedSprayWindow?.hourlyTimeline.map((hour, idx) => {
                    const isSelected = selectedHour?.time === hour.time;
                    const inBest = hour.inBestWindow;

                    const barColor =
                      hour.quality === 'optimal'
                        ? 'bg-[var(--status-good)]'
                        : hour.quality === 'moderate'
                        ? 'bg-[var(--status-marginal)]'
                        : 'bg-[var(--status-poor)]';

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedHour(hour)}
                        className={`relative rounded-md transition-all cursor-pointer h-full ${barColor} ${
                          isSelected ? 'ring-2 ring-white scale-105 z-10' : 'opacity-85 hover:opacity-100'
                        }`}
                        title={`${hour.hourLabel}: ${hour.quality.toUpperCase()} — ${hour.reason}`}
                        aria-label={`${hour.hourLabel} suitability`}
                      >
                        {inBest && (
                          <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* 3-Hour Tick Marks below the strip */}
                <div className="flex justify-between px-1 pt-1.5 text-[10px] text-[var(--text-secondary)] tabular-nums">
                  {evaluatedSprayWindow?.hourlyTimeline
                    .filter((_, idx) => idx % 3 === 0)
                    .map((h, i) => (
                      <span key={i}>{h.hourLabel}</span>
                    ))}
                </div>
              </div>

              {/* Interactive Tooltip Card for Selected Hour */}
              {selectedHour && (
                <div className="p-3.5 rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-glass-elevated)] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        {selectedHour.hourLabel} Detailed Reading
                      </span>
                      {selectedHour.inBestWindow && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--status-good)]/20 text-[var(--status-good)]">
                          Recommended Window
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        selectedHour.quality === 'optimal'
                          ? 'bg-[var(--status-good)]/15 text-[var(--status-good)]'
                          : selectedHour.quality === 'moderate'
                          ? 'bg-[var(--status-marginal)]/15 text-[var(--status-marginal)]'
                          : 'bg-[var(--status-poor)]/15 text-[var(--status-poor)]'
                      }`}
                    >
                      {selectedHour.quality}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)]">{selectedHour.reason}</p>

                  <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                    <div>
                      <span className="text-[10px] text-[var(--text-secondary)] block">Temperature</span>
                      <strong className="text-[var(--text-primary)]">{selectedHour.tempC}°C</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-secondary)] block">Wind</span>
                      <strong className="text-[var(--text-primary)]">{selectedHour.windKmh} km/h</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-secondary)] block">Rain Probability</span>
                      <strong className="text-[var(--text-primary)]">
                        {formatRainProb(selectedHour.rainProb)}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Next Valid Spray Window Card */}
            {evaluatedSprayWindow && (
              <div className="sylva-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[var(--primary-accent)]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      Next Valid Spray Window Details
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-[var(--primary-accent)]">
                    {evaluatedSprayWindow.bestWindowTime}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="p-3 rounded-xl border border-[var(--glass-border-subtle)] bg-[var(--surface-glass-elevated)]">
                    <div className="text-[10px] text-[var(--text-secondary)] font-medium">Max Wind Speed</div>
                    <div className="text-sm font-bold text-[var(--text-primary)] pt-0.5">
                      &lt; {MAX_SPRAY_WIND_KMH} km/h
                    </div>
                    <div className="text-[10px] text-[var(--status-good)] pt-0.5">Minimal droplet drift</div>
                  </div>

                  <div className="p-3 rounded-xl border border-[var(--glass-border-subtle)] bg-[var(--surface-glass-elevated)]">
                    <div className="text-[10px] text-[var(--text-secondary)] font-medium">Post-Spray Drying</div>
                    <div className="text-sm font-bold text-[var(--text-primary)] pt-0.5">
                      6 Hours Rain-Free
                    </div>
                    <div className="text-[10px] text-[var(--status-good)] pt-0.5">Prevents foliar wash-off</div>
                  </div>

                  <div className="p-3 rounded-xl border border-[var(--glass-border-subtle)] bg-[var(--surface-glass-elevated)]">
                    <div className="text-[10px] text-[var(--text-secondary)] font-medium">Thermal Target</div>
                    <div className="text-sm font-bold text-[var(--text-primary)] pt-0.5">
                      &lt; {MAX_SPRAY_TEMP_C}°C
                    </div>
                    <div className="text-[10px] text-[var(--status-good)] pt-0.5">Prevents droplet burn</div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Tab 2: Disease Risk */}
        {activeSegment === 'risk' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={BOUNCY_SPRING}
            className="space-y-4"
          >
            <div className="sylva-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Microclimate Foliar Disease Risk
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Calculated from current relative humidity, night temperatures, and moisture.
                  </p>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                    weather?.fungalRisk === 'high'
                      ? 'bg-[var(--status-poor)]/15 text-[var(--status-poor)]'
                      : weather?.fungalRisk === 'medium'
                      ? 'bg-[var(--status-marginal)]/15 text-[var(--status-marginal)]'
                      : 'bg-[var(--status-good)]/15 text-[var(--status-good)]'
                  }`}
                >
                  {weather?.fungalRisk || 'Medium'} Risk
                </span>
              </div>

              <div className="p-3.5 rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-glass-elevated)] text-xs text-[var(--text-primary)] leading-relaxed">
                {weather && weather.humidityPct > 75
                  ? `High humidity (${weather.humidityPct}%) and warm nights favor fungal spore germination, leaf spots, and powdery mildew. Inspect lower canopy foliage for early lesions.`
                  : `Moderate ambient humidity (${weather?.humidityPct || 65}%) is maintaining stable leaf surfaces with low immediate foliar pathogen spore release.`}
              </div>

              {/* Expandable Why Rules */}
              <div className="pt-2 border-t border-[var(--glass-border-subtle)]">
                <button
                  onClick={() => setShowWhyRules(!showWhyRules)}
                  className="w-full flex items-center justify-between text-xs font-bold text-[var(--primary-accent)] cursor-pointer"
                >
                  <span>Why? Rules &amp; Pathogen Thresholds</span>
                  {showWhyRules ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <AnimatePresence>
                  {showWhyRules && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-3 text-xs text-[var(--text-secondary)] space-y-2 overflow-hidden"
                    >
                      <p>
                        • <strong>Fungal Germination:</strong> Sustained relative humidity &gt; 80% creates free water droplets on leaves, allowing fungal spores (Alternaria, Phytophthora, Cercospora) to penetrate leaf cuticles in 4–8 hours.
                      </p>
                      <p>
                        • <strong>Wind Drift Hazard:</strong> Winds above 15 km/h disperse chemical mist onto neighboring non-target crops and into water bodies, decreasing target canopy coverage.
                      </p>
                      <p>
                        • <strong>Rain Wash-Off:</strong> Soluble systemic pesticides need 4–6 continuous rain-free hours to penetrate stomatal openings.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 3: Forecast (3-Day Minimal Table) */}
        {activeSegment === 'forecast' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={BOUNCY_SPRING}
            className="space-y-4"
          >
            <div className="sylva-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  3-Day Agricultural Forecast
                </h3>
                <span className="text-[11px] text-[var(--text-secondary)]">
                  Open-Meteo High-Resolution Model
                </span>
              </div>

              {/* Compact 3-Day Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {evaluatedSprayWindow?.dailyForecast && evaluatedSprayWindow.dailyForecast.length > 0 ? (
                  evaluatedSprayWindow.dailyForecast.map((day, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-glass-elevated)] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--text-primary)]">
                          {day.dayLabel}
                        </span>
                        <span className="text-[11px] text-[var(--text-secondary)]">
                          {day.condition}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="tabular-nums font-bold text-xl text-[var(--text-primary)]">
                          {day.tempMax}°C
                        </span>
                        <span className="tabular-nums text-xs text-[var(--text-secondary)]">
                          / {day.tempMin}°C
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                        <Droplets className="w-3 h-3 text-[var(--primary-accent)]" />
                        <span>Rain probability: {formatRainProb(day.rainProbMax)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-[var(--text-secondary)] py-4 col-span-3 text-center">
                    Loading daily forecast points...
                  </div>
                )}
              </div>

              {/* Attribution */}
              <div className="pt-2 text-[10px] text-[var(--text-secondary)] text-center opacity-75">
                Weather forecast data provided by{' '}
                <a
                  href="https://open-meteo.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-[var(--text-primary)]"
                >
                  Open-Meteo.com
                </a>{' '}
                under Creative Commons Attribution 4.0.
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
