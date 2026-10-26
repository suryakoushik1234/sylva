import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  CloudSun,
  Droplets,
  Wind,
  AlertTriangle,
  Clock,
  Compass,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Thermometer,
  Search,
  MapPin,
  ChevronDown,
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
  MAX_SPRAY_WIND_KMH,
  MAX_SPRAY_RAIN_PROB_PCT,
  RAIN_FREE_AFTER_WINDOW_HOURS,
  MAX_SPRAY_TEMP_C,
} from '../../utils/weather';
import { EvaluatedSprayWindow, SprayWindowHour } from '../../types';

export const WeatherTab: React.FC = () => {
  const { language, latestDiagnosis, evaluatedSprayWindow, setEvaluatedSprayWindow, openChatWithPrompt } =
    useApp();

  const [isLoading, setIsLoading] = useState<boolean>(!evaluatedSprayWindow);
  const [selectedHour, setSelectedHour] = useState<SprayWindowHour | null>(null);
  const [currentLocationName, setCurrentLocationName] = useState<string>(
    evaluatedSprayWindow?.locationName || DEFAULT_FALLBACK_LOCATION.name
  );
  const [coords, setCoords] = useState<{ lat: number; lon: number }>({
    lat: DEFAULT_FALLBACK_LOCATION.latitude,
    lon: DEFAULT_FALLBACK_LOCATION.longitude,
  });

  // Location selector state
  const [showLocationPicker, setShowLocationPicker] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<GeoLocationResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const titles: Record<string, { title: string; subtitle: string }> = {
    en: {
      title: 'Weather & Spray Advisory',
      subtitle: 'Microclimate indicators, 48-hour continuous forecast, and optimum spray windows.',
    },
    hi: {
      title: 'मौसम और छिड़काव सलाह',
      subtitle: 'सूक्ष्म जलवायु संकेतक, 48 घंटे का पूर्वानुमान और इष्टतम छिड़काव समय।',
    },
    te: {
      title: 'వాతావరణం & పిచికారీ సలహా',
      subtitle: 'సూక్ష్మ వాతావరణ సూచికలు, 48 గంటల నిరంతర సూచన మరియు అనువైన పిచికారీ కిటికీలు.',
    },
    kn: {
      title: 'ಹವಾಮಾನ ಮತ್ತು ಸಿಂಪರಣೆ ಸಲಹೆ',
      subtitle: 'ಸೂಕ್ಷ್ಮ ಹವಾಮಾನ ಸೂಚಕಗಳು, 48-ಗಂಟೆಗಳ ಮುನ್ಸೂಚನೆ ಮತ್ತು ಸೂಕ್ತ ಸಿಂಪರಣೆ ಸಮಯ.',
    },
  };

  const copy = titles[language] || titles.en;

  const loadWeather = async (lat: number, lon: number, locName: string) => {
    setIsLoading(true);
    try {
      const data = await fetchHourlyForecast(lat, lon);
      const windowEvaluation = scanBestSprayWindow(
        data.hourly,
        latestDiagnosis?.conditionName,
        locName
      );
      setEvaluatedSprayWindow(windowEvaluation);
      if (windowEvaluation.hourlyTimeline.length > 0) {
        // Select the best window hour or first hour by default
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

  // Perform live search when typing place name
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length >= 2) {
      setIsSearching(true);
      const res = await searchLocations(val);
      setSearchResults(res);
      setIsSearching(false);
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectLocation = (lat: number, lon: number, name: string) => {
    setCoords({ lat, lon });
    setCurrentLocationName(name);
    setShowLocationPicker(false);
    setSearchQuery('');
    setSearchResults([]);
    loadWeather(lat, lon, name);
  };

  const handleUseGps = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const locName = `Detected Field Coordinates (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
          handleSelectLocation(lat, lon, locName);
        },
        () => {
          alert('GPS location permission denied or unavailable.');
        },
        { timeout: 6000 }
      );
    }
  };

  // Auto-detect geolocation with fallback on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const locName = `Detected Field (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
          setCoords({ lat, lon });
          setCurrentLocationName(locName);
          loadWeather(lat, lon, locName);
        },
        () => {
          // Fallback to Pune Agricultural basin
          loadWeather(
            DEFAULT_FALLBACK_LOCATION.latitude,
            DEFAULT_FALLBACK_LOCATION.longitude,
            DEFAULT_FALLBACK_LOCATION.name
          );
        },
        { timeout: 5000 }
      );
    } else {
      loadWeather(
        DEFAULT_FALLBACK_LOCATION.latitude,
        DEFAULT_FALLBACK_LOCATION.longitude,
        DEFAULT_FALLBACK_LOCATION.name
      );
    }
  }, [latestDiagnosis?.conditionName]);

  const win = evaluatedSprayWindow;

  const getStatusBadge = (status: 'optimal' | 'moderate' | 'poor') => {
    switch (status) {
      case 'optimal':
        return {
          label: 'Optimal Spray Window',
          color: '#34796E',
          bg: 'rgba(52, 121, 110, 0.12)',
          border: 'rgba(52, 121, 110, 0.3)',
          icon: CheckCircle2,
        };
      case 'moderate':
        return {
          label: 'Marginal Window',
          color: '#C0772C',
          bg: 'rgba(192, 119, 44, 0.12)',
          border: 'rgba(192, 119, 44, 0.3)',
          icon: AlertCircle,
        };
      case 'poor':
      default:
        return {
          label: 'Sub-Optimal / Least-Bad Option',
          color: '#A8423F',
          bg: 'rgba(168, 66, 63, 0.12)',
          border: 'rgba(168, 66, 63, 0.3)',
          icon: XCircle,
        };
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Title Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 0.999, y: 0 }}
        transition={BOUNCY_SPRING}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#203A37]">
            {copy.title}
          </h1>
          <p className="text-sm sm:text-base text-[#648078]">{copy.subtitle}</p>
        </div>

        {/* Location selector trigger & refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowLocationPicker(!showLocationPicker)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/80 bg-[#EFF4F2]/90 hover:bg-[#DDEBE5] transition-colors text-xs font-semibold text-[#203A37] shadow-2xs cursor-pointer"
            title="Choose any location or search city"
          >
            <MapPin className="w-3.5 h-3.5 text-[#34796E]" />
            <span className="truncate max-w-[190px]">{currentLocationName}</span>
            <ChevronDown className="w-3 h-3 text-[#648078]" />
          </button>

          <button
            onClick={() => loadWeather(coords.lat, coords.lon, currentLocationName)}
            disabled={isLoading}
            className="p-2 rounded-full border border-white/80 bg-[#EFF4F2]/80 text-[#34796E] hover:bg-[#DDEBE5] transition-colors cursor-pointer shadow-2xs"
            title="Refresh weather data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </motion.div>

      {/* EXPANDABLE LOCATION PICKER MODAL / CARD */}
      {showLocationPicker && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={BOUNCY_SPRING}
          className="sylva-card p-5 sm:p-6 space-y-4 border-2 border-[#34796E]/30 bg-[#EFF4F2]/95 backdrop-blur-xl shadow-lg"
        >
          <div className="flex items-center justify-between pb-2 border-b border-[#A5C9BC]/35">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-[#203A37] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#34796E]" />
                <span>Choose Any Location / Field Location</span>
              </h3>
              <p className="text-xs text-[#648078]">
                Search any Indian city, district, village, or worldwide coordinates.
              </p>
            </div>
            <button
              onClick={() => setShowLocationPicker(false)}
              className="text-xs font-semibold text-[#648078] hover:text-[#203A37] px-2 py-1 rounded-lg hover:bg-white/60 cursor-pointer"
            >
              Done
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#648078] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search any place (e.g. Pune, Ludhiana, Varanasi, Warangal, Guntur, Nashik)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/90 bg-white/90 text-xs sm:text-sm text-[#203A37] placeholder-[#648078] focus:outline-none focus:ring-2 focus:ring-[#34796E]/40 shadow-2xs"
              autoFocus
            />
            {isSearching && (
              <span className="absolute right-3.5 top-3 text-[11px] text-[#648078]">
                Searching...
              </span>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="p-1 rounded-xl bg-white border border-[#A5C9BC]/40 shadow-md divide-y divide-[#EFF4F2] max-h-48 overflow-y-auto">
              {searchResults.map((r) => {
                const label = `${r.name}${r.admin1 ? `, ${r.admin1}` : ''}${r.country ? `, ${r.country}` : ''}`;
                return (
                  <button
                    key={r.id}
                    onClick={() => handleSelectLocation(r.latitude, r.longitude, label)}
                    className="w-full text-left px-3.5 py-2 hover:bg-[#DDEBE5]/70 text-xs text-[#203A37] flex items-center justify-between cursor-pointer"
                  >
                    <span className="font-medium truncate">{label}</span>
                    <span className="text-[10px] text-[#648078] shrink-0 tabular-nums">
                      {r.latitude.toFixed(2)}°, {r.longitude.toFixed(2)}°
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick Actions: GPS Auto-detect */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleUseGps}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#34796E]/30 bg-[#34796E]/10 hover:bg-[#34796E]/20 text-[#34796E] text-xs font-semibold cursor-pointer transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Use Current GPS Coordinates</span>
            </button>
          </div>

          {/* Quick Agricultural Regions of India */}
          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-bold text-[#648078] uppercase tracking-wider">
              Popular Indian Agricultural Regions:
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
              {INDIAN_AGRICULTURAL_HUBS.map((hub) => (
                <button
                  key={hub.name}
                  onClick={() => handleSelectLocation(hub.latitude, hub.longitude, hub.name)}
                  className={`px-3 py-1.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    currentLocationName === hub.name
                      ? 'bg-[#34796E] text-white border-[#34796E]'
                      : 'bg-white/80 border-white/90 text-[#203A37] hover:border-[#34796E]/50 hover:bg-white'
                  }`}
                  title={hub.detail}
                >
                  <span className="font-semibold">{hub.name}</span>
                  <span className="text-[10px] opacity-75 ml-1 hidden sm:inline">({hub.detail})</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* BEST SPRAY WINDOW CARD */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 0.999, y: 0 }}
        transition={{ ...BOUNCY_SPRING, delay: 0.05 }}
        className="sylva-card p-6 sm:p-8 space-y-6"
      >
        {win ? (
          <>
            {/* Header: Dynamic Title + Status Badge */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#A5C9BC]/35">
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-[#34796E] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>48-Hour Microclimate Assessment</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#203A37]">
                  {win.title}
                </h2>
                <p className="text-xs sm:text-sm text-[#648078]">{win.subtitle}</p>
              </div>

              {(() => {
                const badge = getStatusBadge(win.status);
                const Icon = badge.icon;
                return (
                  <div
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border self-start sm:self-auto shrink-0 shadow-2xs"
                    style={{
                      color: badge.color,
                      backgroundColor: badge.bg,
                      borderColor: badge.border,
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{badge.label}</span>
                  </div>
                );
              })()}
            </div>

            {/* Best Window Callout Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#EFF4F2]/80 border border-white/90 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="text-xs font-medium text-[#648078] uppercase tracking-wider">
                    Recommended 3-Hour Application Window
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-[#203A37] tabular-nums">
                    {win.bestWindowTime}
                  </div>
                </div>

                <motion.button
                  onClick={() =>
                    openChatWithPrompt(
                      `What should I consider before spraying during the ${win.bestWindowTime} window?`
                    )
                  }
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  transition={BOUNCY_SPRING}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#34796E] text-[#EFF4F2] text-xs font-semibold hover:bg-[#2c655c] cursor-pointer shadow-xs self-start sm:self-auto"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ask Sylva about Spray Timing</span>
                </motion.button>
              </div>

              {/* Window Rationale */}
              <p className="text-xs sm:text-sm text-[#203A37] leading-relaxed">
                {win.bestWindowReason}
              </p>

              {/* Missed Rule Explanation if least-bad */}
              {win.isFallbackLeastBad && win.missedRuleExplanation && (
                <div className="p-3 rounded-xl bg-[#A8423F]/10 border border-[#A8423F]/30 text-xs text-[#A8423F] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Caution (Missed Criteria): </span>
                    <span>{win.missedRuleExplanation}</span>
                  </div>
                </div>
              )}
            </div>

            {/* 24-HOUR HOURLY TIMELINE BAR */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#203A37]">
                  24-Hour Suitability Timeline
                </span>
                <span className="text-[11px] text-[#648078]">
                  Hover/tap hour for specific conditions
                </span>
              </div>

              {/* Thin Segmented Hourly Timeline Bar */}
              <div className="grid grid-cols-12 sm:grid-cols-24 gap-1 p-2 rounded-2xl bg-[#EFF4F2]/90 border border-white/80">
                {win.hourlyTimeline.map((hour, idx) => {
                  const isSelected = selectedHour?.time === hour.time;
                  const bgStyle =
                    hour.quality === 'optimal'
                      ? '#34796E'
                      : hour.quality === 'moderate'
                      ? '#C0772C'
                      : '#A8423F';

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedHour(hour)}
                      onMouseEnter={() => setSelectedHour(hour)}
                      className={`group relative h-9 rounded-lg flex flex-col items-center justify-center transition-all duration-150 cursor-pointer ${
                        hour.inBestWindow ? 'ring-2 ring-[#34796E] ring-offset-1 scale-105 z-10' : ''
                      } ${isSelected ? 'scale-110 shadow-md z-20' : 'opacity-85 hover:opacity-100'}`}
                      style={{ backgroundColor: bgStyle }}
                      title={`${hour.hourLabel}: ${hour.tempC}°C, ${hour.windKmh}km/h wind, ${hour.rainProb}% rain`}
                    >
                      <span className="text-[9px] font-bold text-white select-none">
                        {hour.hourLabel.replace(':00', '').replace(' ', '')}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Hour Details Tooltip / Card */}
              {selectedHour && (
                <motion.div
                  key={selectedHour.time}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={BOUNCY_SPRING}
                  className="p-3.5 rounded-xl bg-[#EFF4F2]/90 border border-white/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          selectedHour.quality === 'optimal'
                            ? '#34796E'
                            : selectedHour.quality === 'moderate'
                            ? '#C0772C'
                            : '#A8423F',
                      }}
                    />
                    <div>
                      <span className="font-bold text-[#203A37]">
                        {selectedHour.hourLabel}:
                      </span>{' '}
                      <span className="text-[#648078]">{selectedHour.reason}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[#203A37] font-semibold tabular-nums self-end sm:self-auto shrink-0">
                    <span className="flex items-center gap-1">
                      <Thermometer className="w-3.5 h-3.5 text-[#34796E]" />
                      {selectedHour.tempC}°C
                    </span>
                    <span className="flex items-center gap-1">
                      <Wind className="w-3.5 h-3.5 text-[#34796E]" />
                      {selectedHour.windKmh} km/h
                    </span>
                    <span className="flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5 text-[#34796E]" />
                      {selectedHour.rainProb}% rain
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Legend */}
              <div className="flex items-center justify-center gap-5 pt-1 text-[11px] text-[#648078]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#34796E]" />
                  <span>Optimal (&lt;15 km/h, &lt;20% rain)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C0772C]" />
                  <span>Marginal / Evaporative</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#A8423F]" />
                  <span>Poor / Rain or Drift risk</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
            <RefreshCw className="w-6 h-6 text-[#34796E] animate-spin" />
            <p className="text-xs text-[#648078]">Calibrating microclimate and spray window...</p>
          </div>
        )}
      </motion.div>

      {/* Microclimate Overview Tabular Metrics */}
      {win && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 0.999, y: 0 }}
          transition={{ ...BOUNCY_SPRING, delay: 0.1 }}
          className="sylva-card p-6 sm:p-8 space-y-5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#A5C9BC]/35">
            <div className="text-sm font-bold text-[#203A37] flex items-center gap-2">
              <CloudSun className="w-4 h-4 text-[#34796E]" />
              <span>Current Field Microclimate</span>
            </div>
            <div className="text-xs text-[#648078] tabular-nums">
              Open-Meteo Verified Forecast
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#EFF4F2]/75 border border-white/70">
              <div className="text-xs font-medium text-[#648078] mb-1">Ambient Temperature</div>
              <div className="text-2xl font-bold text-[#203A37] tabular-nums">
                {win.currentTemp}°C
              </div>
              <div className="text-xs text-[#648078] mt-1">
                {win.currentTemp < MAX_SPRAY_TEMP_C ? 'Within safe absorption range' : 'Elevated evaporation'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#EFF4F2]/75 border border-white/70">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#648078]">Wind Speed</span>
                <Wind className="w-3.5 h-3.5 text-[#34796E]" />
              </div>
              <div className="text-2xl font-bold text-[#203A37] tabular-nums">
                {win.currentWind} km/h
              </div>
              <div
                className={`text-xs mt-1 font-medium ${
                  win.currentWind < MAX_SPRAY_WIND_KMH ? 'text-[#34796E]' : 'text-[#A8423F]'
                }`}
              >
                {win.currentWind < MAX_SPRAY_WIND_KMH
                  ? 'Calm (< 15 km/h limit)'
                  : 'High drift risk (> 15 km/h)'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#EFF4F2]/75 border border-white/70">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#648078]">Foliar Rain Risk</span>
                <Droplets className="w-3.5 h-3.5 text-[#34796E]" />
              </div>
              <div className="text-2xl font-bold text-[#203A37] capitalize">
                {win.currentRainRisk}
              </div>
              <div className="text-xs text-[#648078] mt-1">
                {win.currentRainRisk === 'low'
                  ? 'Safe 6h+ drying adherence window'
                  : 'Risk of treatment dilution or wash-off'}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
