/**
 * FIAvatar - Free Intelligence Avatar for Waiting Room
 *
 * Card: FI-UI-FEAT-TVD-001
 * Displays Free Intelligence as a welcoming host in clinic waiting rooms
 * Inspired by Telesecundaria model + modern AI receptionist systems
 */

'use client';

import { useState, useEffect } from 'react';
import { FIMessageBubble } from '../onboarding/FIMessageBubble';
import type { FIMessage } from '@/types/assistant';
import {
  WeatherWidget,
  HealthTriviaWidget,
  BreathingExerciseWidget,
  DailyTipWidget,
  CalmingNatureWidget,
  ClinicImageWidget,
  ClinicVideoWidget,
  ClinicMessageWidget,
} from './TVWidgets';
import { waitingRoomAPI, type TipCategory } from '@/lib/api/waiting-room';

/**
 * Simple cache with TTL for AI-generated content
 * Reduces LLM costs by caching tips/trivia for 30 minutes
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

class ContentCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  set<T>(key: string, data: T, ttl: number = 30 * 60 * 1000): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }
}

const contentCache = new ContentCache();

export interface ContentItem {
  type: 'welcome' | 'tip' | 'metric' | 'philosophy' | 'doctor_message' | 'widget';
  content: string;
  duration?: number; // ms to display (default: 15000)
  metadata?: Record<string, any>;
  widgetType?: 'weather' | 'trivia' | 'breathing' | 'daily_tip' | 'calming' | 'clinic_image' | 'clinic_video' | 'clinic_message';
  widgetData?: any;
}

interface ClinicSlide {
  media_id: string;
  media_type: 'image' | 'video' | 'message';
  title?: string;
  description?: string;
  file_path?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  uploaded_at: number;
  uploaded_by: string;
  clinic_id: string;
  duration: number;
  is_active: boolean;
}

interface FIAvatarProps {
  mode?: 'broadcast' | 'interactive';
  clinicName?: string;
  doctorMessage?: string | null; // Message from doctor control panel
  clinicSlides?: ClinicSlide[]; // Slides from backend to append
  onInteraction?: () => void;
  // External navigation control (for preview mode)
  externalCurrentIndex?: number;
  onIndexChange?: (index: number) => void;
  onContentLoad?: (totalItems: number, contentArray?: ContentItem[]) => void; // Callback when content is loaded
}

/**
 * Fetch FI content seeds from backend API
 * Replaces hardcoded DEFAULT_CONTENT with editable seeds from DB
 * Card: FI-TV-REFAC-001
 */
async function fetchContentSeeds(): Promise<ContentItem[]> {
  try {
    const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://fi-aurity.duckdns.org';
    const response = await fetch(`${backendURL}/api/workflows/aurity/tv-content/list?active_only=true`);

    if (!response.ok) {
      throw new Error(`Failed to fetch seeds: ${response.status}`);
    }

    const data = await response.json();

    // Convert TVContentSeed[] to ContentItem[]
    const seeds: ContentItem[] = data.content.map((seed: any) => ({
      type: seed.type,
      content: seed.content,
      duration: seed.duration,
      widgetType: seed.widget_type,
      widgetData: seed.widget_data,
      metadata: {
        content_id: seed.content_id,
        is_system_default: seed.is_system_default,
        display_order: seed.display_order,
      },
    }));

    return seeds;
  } catch (error) {
    console.error('Failed to fetch content seeds, using fallback:', error);

    // Fallback to minimal static content if API fails
    return [
      {
        type: 'welcome',
        content: 'Bienvenidos a nuestra clínica. Free Intelligence está aquí para acompañarlos durante su espera.',
        duration: 12000,
      },
      {
        type: 'tip',
        content: '💧 **Tip de Salud**: Mantenerse hidratado es esencial. Beba al menos 8 vasos de agua al día para una salud óptima.',
        duration: 15000,
      },
    ];
  }
}

/**
 * Fetch a dynamic health tip with caching
 */
async function fetchDynamicTip(category: TipCategory): Promise<string> {
  const cacheKey = `tip_${category}`;

  // Check cache first
  const cached = contentCache.get<string>(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch from API
  try {
    const response = await waitingRoomAPI.generateTip({ category });
    const tip = response.tip;

    // Cache for 30 minutes
    contentCache.set(cacheKey, tip, 30 * 60 * 1000);

    return tip;
  } catch (error) {
    console.error('Failed to fetch dynamic tip:', error);
    // Fallback to static content
    return 'Mantenerse activo y comer balanceado son pilares de una vida saludable.';
  }
}

/**
 * Fetch a dynamic trivia question with caching
 */
async function fetchDynamicTrivia() {
  const cacheKey = 'trivia_easy';

  // Check cache first
  const cached = contentCache.get<any>(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch from API
  try {
    const response = await waitingRoomAPI.generateTrivia({ difficulty: 'easy' });

    const triviaData = {
      question: response.question,
      options: response.options,
      correctAnswer: response.correct_answer,
      explanation: response.explanation,
    };

    // Cache for 30 minutes
    contentCache.set(cacheKey, triviaData, 30 * 60 * 1000);

    return triviaData;
  } catch (error) {
    console.error('Failed to fetch dynamic trivia:', error);
    // Fallback to static content
    return {
      question: '¿Cuántos vasos de agua se recomienda beber al día?',
      options: ['4-5 vasos', '6-7 vasos', '8-10 vasos', '12-15 vasos'],
      correctAnswer: 2,
      explanation: 'Se recomienda beber entre 8 y 10 vasos de agua al día para mantener una hidratación adecuada.',
    };
  }
}

export function FIAvatar({
  mode = 'broadcast',
  clinicName = 'nuestra clínica',
  doctorMessage = null,
  clinicSlides = [],
  onInteraction,
  externalCurrentIndex,
  onIndexChange,
  onContentLoad,
}: FIAvatarProps) {
  const [internalCurrentIndex, setInternalCurrentIndex] = useState(0);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [displayMessage, setDisplayMessage] = useState<FIMessage | null>(null);
  const [isLoadingDynamic, setIsLoadingDynamic] = useState(true); // Start as loading

  // Use external index if provided, otherwise internal
  const currentIndex = externalCurrentIndex !== undefined ? externalCurrentIndex : internalCurrentIndex;

  // Load content from API seeds + dynamic content on mount
  useEffect(() => {
    async function loadDynamicContent() {
      setIsLoadingDynamic(true);
      try {
        // 1. Fetch FI content seeds from API (replaces hardcoded DEFAULT_CONTENT)
        const baseSeeds = await fetchContentSeeds();

        // 2. Fetch dynamic tip (nutrition category as example)
        const dynamicTip = await fetchDynamicTip('nutrition');

        // 3. Fetch dynamic trivia
        const dynamicTrivia = await fetchDynamicTrivia();

        // 4. Update seeds with dynamic content
        let updatedContent = [...baseSeeds];

        // Find the daily_tip widget and update it
        const tipIndex = updatedContent.findIndex(
          item => item.type === 'widget' && item.widgetType === 'daily_tip'
        );
        if (tipIndex !== -1) {
          updatedContent[tipIndex] = {
            ...updatedContent[tipIndex],
            widgetData: {
              tip: dynamicTip,
              category: 'nutrition',
              generatedBy: 'FI',
            },
          };
        }

        // Find the trivia widget and update it
        const triviaIndex = updatedContent.findIndex(
          item => item.type === 'widget' && item.widgetType === 'trivia'
        );
        if (triviaIndex !== -1) {
          updatedContent[triviaIndex] = {
            ...updatedContent[triviaIndex],
            widgetData: dynamicTrivia,
          };
        }

        // Append clinic slides from backend
        clinicSlides.forEach(slide => {
          if (slide.media_type === 'image' && slide.file_path) {
            // Build image URL from file_path
            const imageUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://fi-aurity.duckdns.org'}/api/workflows/aurity/clinic-media/file/${slide.file_path}`;
            updatedContent.push({
              type: 'widget',
              content: '',
              duration: slide.duration,
              widgetType: 'clinic_image',
              widgetData: {
                imageUrl,
                title: slide.title,
                description: slide.description,
              },
            });
          } else if (slide.media_type === 'video' && slide.file_path) {
            // Build video URL from file_path
            const videoUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://fi-aurity.duckdns.org'}/api/workflows/aurity/clinic-media/file/${slide.file_path}`;
            updatedContent.push({
              type: 'widget',
              content: '',
              duration: slide.duration,
              widgetType: 'clinic_video',
              widgetData: {
                videoUrl,
                title: slide.title,
                description: slide.description,
              },
            });
          } else if (slide.media_type === 'message') {
            // For messages, use description as the message content
            updatedContent.push({
              type: 'widget',
              content: '',
              duration: slide.duration,
              widgetType: 'clinic_message',
              widgetData: {
                message: slide.description || slide.title || 'Mensaje',
                title: slide.title,
              },
            });
          }
        });

        setContent(updatedContent);

        // Notify parent of total content count and full array
        onContentLoad?.(updatedContent.length, updatedContent);
      } catch (error) {
        console.error('Failed to load dynamic content:', error);
        // Fallback: Notify with empty content
        onContentLoad?.(0);
      } finally {
        setIsLoadingDynamic(false);
      }
    }

    loadDynamicContent();
  }, [clinicSlides]); // Re-run when clinic slides change (onContentLoad removed to prevent infinite loop)

  // Inject doctor message at the beginning if provided
  useEffect(() => {
    if (doctorMessage) {
      const doctorContent: ContentItem = {
        type: 'doctor_message',
        content: `📢 **Mensaje del Doctor**: ${doctorMessage}`,
        duration: 20000, // Doctor messages stay longer
      };

      // Insert doctor message at index 1 (after welcome)
      setContent(prev => {
        const newContent = [...prev]; // Use current content (which may have dynamic data)
        newContent.splice(1, 0, doctorContent);
        return newContent;
      });

      // Reset to beginning to show doctor message
      if (externalCurrentIndex === undefined) {
        setInternalCurrentIndex(0);
        onIndexChange?.(0);
      }
    }
  }, [doctorMessage]);

  // Content rotation cycle
  useEffect(() => {
    const currentContent = content[currentIndex];

    // Guard: Don't render if content not loaded yet
    if (!currentContent) {
      return;
    }

    const duration = currentContent.duration || 15000;

    // Convert content to FIMessage format
    setDisplayMessage({
      role: 'assistant',
      content: currentContent.content.replace(/\*\*(.*?)\*\*/g, '$1'), // Strip markdown bold for plain display
      timestamp: new Date().toISOString(),
      metadata: {
        id: `fi-avatar-${currentIndex}`,
      },
    });

    // Auto-advance to next content after duration (only if not externally controlled)
    let timer: NodeJS.Timeout | null = null;
    if (externalCurrentIndex === undefined) {
      timer = setTimeout(() => {
        const nextIndex = (currentIndex + 1) % content.length;
        setInternalCurrentIndex(nextIndex);
        onIndexChange?.(nextIndex);
      }, duration);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [currentIndex, content, externalCurrentIndex, onIndexChange]);

  // Handle interaction (future: QR code → chat)
  const handleClick = () => {
    if (mode === 'interactive' && onInteraction) {
      onInteraction();
    }
  };

  return (
    <div
      className="relative"
      onClick={handleClick}
    >
      {/* Avatar Container */}
      <div className="flex items-start gap-6">
        {/* Left: Avatar Icon */}
        <div className="flex-shrink-0">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600/20 to-purple-800/20 border-2 border-purple-500/40 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <div className="text-5xl">👋</div>
          </div>
          {/* Live indicator */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
            <span className="text-xs font-medium text-green-400 tracking-wide">EN VIVO</span>
          </div>
        </div>

        {/* Right: Message Bubble or Widget */}
        <div className="flex-1">
          {content[currentIndex]?.type === 'widget' ? (
            // Render Widget
            <div className="transform transition-all duration-500 ease-in-out">
              {content[currentIndex].widgetType === 'weather' && <WeatherWidget city={clinicName} />}
              {content[currentIndex].widgetType === 'trivia' && (
                <HealthTriviaWidget {...content[currentIndex].widgetData} />
              )}
              {content[currentIndex].widgetType === 'breathing' && <BreathingExerciseWidget />}
              {content[currentIndex].widgetType === 'daily_tip' && (
                <DailyTipWidget {...content[currentIndex].widgetData} />
              )}
              {content[currentIndex].widgetType === 'calming' && <CalmingNatureWidget />}
              {content[currentIndex].widgetType === 'clinic_image' && (
                <ClinicImageWidget {...content[currentIndex].widgetData} />
              )}
              {content[currentIndex].widgetType === 'clinic_video' && (
                <ClinicVideoWidget {...content[currentIndex].widgetData} />
              )}
              {content[currentIndex].widgetType === 'clinic_message' && (
                <ClinicMessageWidget {...content[currentIndex].widgetData} />
              )}
            </div>
          ) : (
            // Render Message Bubble
            displayMessage && (
              <div className="transform transition-all duration-500 ease-in-out">
                <FIMessageBubble
                  message={displayMessage}
                  showTimestamp={false}
                  animate={true}
                />
              </div>
            )
          )}

          {/* Content progress indicator */}
          <div className="mt-4 flex items-center gap-2">
            {content.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-purple-500'
                    : index < currentIndex
                    ? 'bg-purple-700'
                    : 'bg-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Interaction hint (if interactive mode) */}
          {mode === 'interactive' && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-900/30 border border-purple-500/30 rounded-lg">
                <span className="text-sm text-purple-300">
                  Escanea el código QR para interactuar →
                </span>
                {/* Placeholder for QR code */}
                <div className="w-16 h-16 bg-white rounded flex items-center justify-center">
                  <span className="text-xs text-slate-900">QR</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clinic branding footer */}
      <div className="mt-8 pt-6 border-t border-slate-700/50">
        <div className="flex items-center justify-between text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-300">{clinicName}</span>
            <span>·</span>
            <span>Powered by AURITY</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span>Sistema On-Premise</span>
          </div>
        </div>
      </div>
    </div>
  );
}
