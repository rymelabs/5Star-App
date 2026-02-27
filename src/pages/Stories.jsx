import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, PlayCircle, Clock3, Image as ImageIcon, Type, Link as LinkIcon, Video, X, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFootball } from '../context/FootballContext';
import { useCompetitions } from '../context/CompetitionsContext';
import { useNotification } from '../context/NotificationContext';
import PitchSnapLogo from '../components/PitchSnapLogo';
import { storiesCollection } from '../firebase/firestore';
import { uploadImage, validateImageFile } from '../services/imageUploadService';
import { uploadVideoWithProgress } from '../services/videoUploadService';
import { getEmbedUrl } from '../utils/helpers';

const STORY_TYPE_PRIORITY = {
  season: 0,
  competition: 1,
  fixture: 2,
  league: 3,
  admin: 4,
  team: 5,
  general: 6
};

const STORY_ENTITY_LABEL = {
  season: 'Season',
  competition: 'Competition',
  fixture: 'Fixture',
  league: 'League',
  admin: 'Admin',
  team: 'Team',
  general: 'General'
};

const FONT_OPTIONS = [
  { value: 'inherit', label: 'Default' },
  { value: "'Trebuchet MS', sans-serif", label: 'Trebuchet' },
  { value: "'Georgia', serif", label: 'Georgia' },
  { value: "'Courier New', monospace", label: 'Courier' },
  { value: "'Verdana', sans-serif", label: 'Verdana' },
  { value: "'Impact', sans-serif", label: 'Impact' }
];

const INITIAL_FORM = {
  contentType: 'text',
  text: '',
  mediaUrl: '',
  videoLink: '',
  durationHours: 24,
  entityType: 'season',
  entityId: '',
  backgroundColor: '#1f2937',
  textColor: '#ffffff',
  fontFamily: 'inherit'
};

const SNAP_AUTO_ADVANCE_MS = 30000;
const VIEWED_STORIES_STORAGE_KEY = 'viewedPitchSnapIds';

const loadViewedStoryIds = () => {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.sessionStorage.getItem(VIEWED_STORIES_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map((id) => String(id)));
  } catch {
    return new Set();
  }
};

const toDate = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') {
    try {
      return value.toDate();
    } catch {
      return null;
    }
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeIdSet = (...arrays) => {
  const ids = new Set();
  const append = (value) => {
    if (!value) return;
    if (Array.isArray(value) || value instanceof Set) {
      value.forEach((nestedValue) => append(nestedValue));
      return;
    }
    ids.add(String(value));
  };

  arrays.forEach((value) => append(value));
  return ids;
};

const pullFollowIds = (user, keys = []) => {
  if (!user || typeof user !== 'object') return [];
  return keys.flatMap((key) => {
    const value = user[key];
    return Array.isArray(value) ? value : [];
  });
};

const Stories = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();
  const { fixtures, leagues, seasons, teams, followedTeams } = useFootball();
  const { competitions } = useCompetitions();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [isSnapPaused, setIsSnapPaused] = useState(false);
  const touchStartYRef = useRef(null);
  const touchStartXRef = useRef(null);
  const touchMovedRef = useRef(false);
  const wheelLockRef = useRef(0);
  const viewedStoryIdsRef = useRef(loadViewedStoryIds());
  const isSnapPausedRef = useRef(false);

  const isAdmin = Boolean(user?.isAdmin);

  useEffect(() => {
    if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) {
      setLoading(false);
      setStories([]);
      return () => {};
    }

    let firstSnapshot = true;
    const unsubscribe = storiesCollection.onActiveSnapshot((activeStories) => {
      setStories(activeStories);
      if (firstSnapshot) {
        setLoading(false);
        firstSnapshot = false;
      }
    });

    return () => unsubscribe();
  }, []);

  const followedTeamIds = useMemo(
    () => normalizeIdSet((followedTeams || []).map((team) => team.id)),
    [followedTeams]
  );

  const explicitFollowSets = useMemo(() => {
    return {
      leagueIds: normalizeIdSet(
        pullFollowIds(user, ['followedLeagues', 'followedLeagueIds', 'followingLeagues', 'leagueFollows'])
      ),
      seasonIds: normalizeIdSet(
        pullFollowIds(user, ['followedSeasons', 'followedSeasonIds', 'followingSeasons', 'seasonFollows'])
      ),
      competitionIds: normalizeIdSet(
        pullFollowIds(user, ['followedCompetitions', 'followedCompetitionIds', 'followingCompetitions', 'competitionFollows'])
      ),
      fixtureIds: normalizeIdSet(
        pullFollowIds(user, ['followedFixtures', 'followedFixtureIds', 'followingFixtures', 'fixtureFollows'])
      ),
      adminIds: normalizeIdSet(
        pullFollowIds(user, ['followedAdmins', 'followedAdminIds', 'followingAdmins', 'adminFollows'])
      )
    };
  }, [user]);

  const derivedFollowSets = useMemo(() => {
    if (!followedTeamIds.size) {
      return {
        leagueIds: new Set(),
        seasonIds: new Set(),
        fixtureIds: new Set(),
        competitionNames: new Set()
      };
    }

    const leagueIds = new Set();
    const seasonIds = new Set();
    const fixtureIds = new Set();
    const competitionNames = new Set();

    (fixtures || []).forEach((fixture) => {
      const homeTeamId = fixture?.homeTeamId ? String(fixture.homeTeamId) : '';
      const awayTeamId = fixture?.awayTeamId ? String(fixture.awayTeamId) : '';
      if (!followedTeamIds.has(homeTeamId) && !followedTeamIds.has(awayTeamId)) return;

      fixtureIds.add(String(fixture.id));
      if (fixture.leagueId) leagueIds.add(String(fixture.leagueId));
      if (fixture.seasonId) seasonIds.add(String(fixture.seasonId));
      if (fixture.competition) competitionNames.add(String(fixture.competition).trim().toLowerCase());
    });

    return { leagueIds, seasonIds, fixtureIds, competitionNames };
  }, [fixtures, followedTeamIds]);

  const followedAdminIds = useMemo(() => {
    const fromStories = (stories || [])
      .map((story) => story?.ownerId)
      .filter(Boolean);
    return normalizeIdSet(explicitFollowSets.adminIds, fromStories.includes(user?.uid) ? [user?.uid] : []);
  }, [explicitFollowSets.adminIds, stories, user?.uid]);

  const adminOptions = useMemo(() => {
    const map = new Map();
    const addAdmin = (id, name) => {
      if (!id) return;
      const key = String(id);
      if (map.has(key)) return;
      map.set(key, { id: key, name: name || 'Unknown Admin' });
    };

    addAdmin(user?.uid, user?.displayName || user?.name || user?.email || 'Me');
    (stories || []).forEach((story) => addAdmin(story?.ownerId, story?.ownerName));
    (leagues || []).forEach((item) => addAdmin(item?.ownerId, item?.ownerName));
    (seasons || []).forEach((item) => addAdmin(item?.ownerId, item?.ownerName));
    (fixtures || []).forEach((item) => addAdmin(item?.ownerId, item?.ownerName));

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [fixtures, leagues, seasons, stories, user]);

  const entityOptions = useMemo(() => {
    const fixtureOptions = (fixtures || [])
      .slice()
      .sort((a, b) => (toDate(b.dateTime)?.getTime() || 0) - (toDate(a.dateTime)?.getTime() || 0))
      .slice(0, 250)
      .map((fixture) => ({
        id: String(fixture.id),
        label: `${fixture.homeTeam?.name || 'Home'} vs ${fixture.awayTeam?.name || 'Away'}`
      }));

    return {
      season: (seasons || []).map((season) => ({ id: String(season.id), label: season.name || 'Season' })),
      competition: (competitions || []).map((comp) => ({ id: String(comp.id), label: comp.name || 'Competition' })),
      fixture: fixtureOptions,
      league: (leagues || []).map((league) => ({ id: String(league.id), label: league.name || 'League' })),
      admin: adminOptions.map((admin) => ({ id: admin.id, label: admin.name })),
      team: (teams || []).map((team) => ({ id: String(team.id), label: team.name || 'Team' })),
      general: []
    };
  }, [adminOptions, competitions, fixtures, leagues, seasons, teams]);

  const getEntityDisplayName = useCallback((story) => {
    if (story?.entityName) return story.entityName;
    const entityType = story?.entityType || 'general';
    const entityId = story?.entityId ? String(story.entityId) : '';
    if (!entityId || !entityOptions[entityType]) return STORY_ENTITY_LABEL[entityType] || 'Update';
    return entityOptions[entityType].find((option) => option.id === entityId)?.label || (STORY_ENTITY_LABEL[entityType] || 'Update');
  }, [entityOptions]);

  const isPriorityStory = useCallback((story) => {
    const entityType = story?.entityType || 'general';
    const entityId = story?.entityId ? String(story.entityId) : '';
    const ownerId = story?.ownerId ? String(story.ownerId) : '';

    if (ownerId && followedAdminIds.has(ownerId)) return true;

    if (entityType === 'team') {
      return entityId ? followedTeamIds.has(entityId) : false;
    }
    if (entityType === 'fixture') {
      return entityId ? (explicitFollowSets.fixtureIds.has(entityId) || derivedFollowSets.fixtureIds.has(entityId)) : false;
    }
    if (entityType === 'season') {
      return entityId ? (explicitFollowSets.seasonIds.has(entityId) || derivedFollowSets.seasonIds.has(entityId)) : false;
    }
    if (entityType === 'league') {
      return entityId ? (explicitFollowSets.leagueIds.has(entityId) || derivedFollowSets.leagueIds.has(entityId)) : false;
    }
    if (entityType === 'competition') {
      if (!entityId && !story?.entityName) return false;
      if (entityId && explicitFollowSets.competitionIds.has(entityId)) return true;
      const normalizedName = String(story?.entityName || '').trim().toLowerCase();
      return normalizedName ? derivedFollowSets.competitionNames.has(normalizedName) : false;
    }
    if (entityType === 'admin') {
      return ownerId ? followedAdminIds.has(ownerId) : false;
    }
    return false;
  }, [derivedFollowSets.competitionNames, derivedFollowSets.fixtureIds, derivedFollowSets.leagueIds, derivedFollowSets.seasonIds, explicitFollowSets.competitionIds, explicitFollowSets.fixtureIds, explicitFollowSets.leagueIds, explicitFollowSets.seasonIds, followedAdminIds, followedTeamIds]);

  const sortedStories = useMemo(() => {
    return (stories || [])
      .map((story) => ({
        ...story,
        __priorityFollowed: isPriorityStory(story),
        __typeRank: STORY_TYPE_PRIORITY[story?.entityType] ?? 99,
        __createdAtMs: toDate(story?.createdAt)?.getTime() || 0
      }))
      .sort((a, b) => {
        if (a.__priorityFollowed !== b.__priorityFollowed) {
          return a.__priorityFollowed ? -1 : 1;
        }
        if (a.__typeRank !== b.__typeRank) {
          return a.__typeRank - b.__typeRank;
        }
        return b.__createdAtMs - a.__createdAtMs;
      });
  }, [isPriorityStory, stories]);

  const groupedStories = useMemo(() => {
    const groups = new Map();
    sortedStories.forEach((story) => {
      const ownerKey = String(story?.ownerId || 'unknown');
      if (!groups.has(ownerKey)) {
        groups.set(ownerKey, {
          ownerId: ownerKey,
          ownerName: story?.ownerName || 'Admin',
          stories: []
        });
      }
      groups.get(ownerKey).stories.push(story);
    });

    return Array.from(groups.values());
  }, [sortedStories]);

  const currentGroup = groupedStories[currentGroupIndex] || null;
  const currentStory = currentGroup?.stories?.[currentStoryIndex] || null;

  useEffect(() => {
    if (!groupedStories.length) {
      setCurrentGroupIndex(0);
      setCurrentStoryIndex(0);
      return;
    }

    setCurrentGroupIndex((prev) => Math.min(prev, groupedStories.length - 1));
  }, [groupedStories]);

  useEffect(() => {
    if (!currentGroup) return;
    setCurrentStoryIndex((prev) => Math.min(prev, Math.max(0, currentGroup.stories.length - 1)));
  }, [currentGroup]);

  const moveToNextGroup = useCallback(() => {
    if (!groupedStories.length) return;
    setCurrentGroupIndex((prev) => (prev + 1) % groupedStories.length);
    setCurrentStoryIndex(0);
  }, [groupedStories.length]);

  const moveToPreviousGroup = useCallback(() => {
    if (!groupedStories.length) return;
    setCurrentGroupIndex((prev) => (prev - 1 + groupedStories.length) % groupedStories.length);
    setCurrentStoryIndex(0);
  }, [groupedStories.length]);

  const moveToNextStory = useCallback(() => {
    if (!currentGroup) return;
    if (currentStoryIndex < currentGroup.stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
      return;
    }
    moveToNextGroup();
  }, [currentGroup, currentStoryIndex, moveToNextGroup]);

  const moveToPreviousStory = useCallback(() => {
    if (!currentGroup) return;
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
      return;
    }
    moveToPreviousGroup();
  }, [currentGroup, currentStoryIndex, moveToPreviousGroup]);

  const handlePauseStart = useCallback(() => {
    setIsSnapPaused(true);
  }, []);

  const handlePauseEnd = useCallback(() => {
    setIsSnapPaused(false);
  }, []);

  const persistViewedStoryIds = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(
        VIEWED_STORIES_STORAGE_KEY,
        JSON.stringify(Array.from(viewedStoryIdsRef.current))
      );
    } catch {
      // Ignore storage write failures
    }
  }, []);

  const markStoryViewed = useCallback(async (storyId) => {
    const normalizedStoryId = storyId ? String(storyId) : '';
    if (!normalizedStoryId || viewedStoryIdsRef.current.has(normalizedStoryId)) return;

    viewedStoryIdsRef.current.add(normalizedStoryId);
    persistViewedStoryIds();
    await storiesCollection.incrementView(normalizedStoryId);
  }, [persistViewedStoryIds]);

  useEffect(() => {
    isSnapPausedRef.current = isSnapPaused;
  }, [isSnapPaused]);

  useEffect(() => {
    if (!currentStory?.id) return;

    setStoryProgress(0);
    setIsSnapPaused(false);
    isSnapPausedRef.current = false;
    let elapsedMs = 0;
    let lastTickMs = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();

      if (isSnapPausedRef.current) {
        lastTickMs = now;
        return;
      }

      elapsedMs = Math.min(SNAP_AUTO_ADVANCE_MS, elapsedMs + (now - lastTickMs));
      lastTickMs = now;

      const percent = Math.min(100, (elapsedMs / SNAP_AUTO_ADVANCE_MS) * 100);
      setStoryProgress(percent);

      if (elapsedMs >= SNAP_AUTO_ADVANCE_MS) {
        clearInterval(interval);
        setStoryProgress(100);
        moveToNextStory();
      }
    }, 120);

    return () => clearInterval(interval);
  }, [currentStory?.id, moveToNextStory]);

  useEffect(() => {
    if (!currentStory?.id) return;
    markStoryViewed(currentStory.id);
  }, [currentStory?.id, markStoryViewed]);

  const handleWheel = (event) => {
    const now = Date.now();
    if (now - wheelLockRef.current < 450) return;
    if (Math.abs(event.deltaY) < 30) return;
    wheelLockRef.current = now;
    if (event.deltaY > 0) {
      moveToNextGroup();
    } else {
      moveToPreviousGroup();
    }
  };

  const handleTouchStart = (event) => {
    handlePauseStart();
    const touch = event.touches?.[0];
    touchStartYRef.current = touch?.clientY ?? null;
    touchStartXRef.current = touch?.clientX ?? null;
    touchMovedRef.current = false;
  };

  const handleTouchMove = (event) => {
    const touch = event.touches?.[0];
    if (!touch || touchStartYRef.current == null || touchStartXRef.current == null) return;
    const deltaY = Math.abs(touchStartYRef.current - touch.clientY);
    const deltaX = Math.abs(touchStartXRef.current - touch.clientX);
    if (deltaY > 12 || deltaX > 12) {
      touchMovedRef.current = true;
    }
  };

  const handleTouchEnd = (event) => {
    handlePauseEnd();
    if (touchStartYRef.current == null) return;
    const touchEndY = event.changedTouches?.[0]?.clientY ?? touchStartYRef.current;
    const delta = touchStartYRef.current - touchEndY;
    if (Math.abs(delta) > 55) {
      if (delta > 0) moveToNextGroup();
      else moveToPreviousGroup();
    }
    touchStartYRef.current = null;
    touchStartXRef.current = null;
  };

  const handleTouchCancel = () => {
    handlePauseEnd();
    touchStartYRef.current = null;
    touchStartXRef.current = null;
    touchMovedRef.current = false;
  };

  const handleSnapTap = useCallback((direction) => {
    if (touchMovedRef.current) {
      touchMovedRef.current = false;
      return;
    }
    if (direction === 'next') {
      moveToNextStory();
      return;
    }
    moveToPreviousStory();
  }, [moveToNextStory, moveToPreviousStory]);

  const formatStoryViews = useCallback((views) => {
    const safeViews = Number(views || 0);
    return Number.isFinite(safeViews) ? safeViews.toLocaleString() : '0';
  }, []);

  const currentStoryViews = Number(currentStory?.views || 0);
  const snapViewportHeightClass = showComposer
    ? 'h-[60dvh] md:h-[78vh]'
    : 'h-[calc(100dvh-9rem)] md:h-[78vh]';

  useEffect(() => {
    if (!currentStory?.id) return;
    touchMovedRef.current = false;
    setIsSnapPaused(false);
  }, [currentStory?.id]);

  const resetComposer = () => {
    setFormData(INITIAL_FORM);
    setSelectedImageFile(null);
    setSelectedVideoFile(null);
    setUploadProgress(0);
  };

  const handleComposerToggle = () => {
    setShowComposer((prev) => !prev);
    if (showComposer) {
      resetComposer();
    }
  };

  const handleEntityTypeChange = (entityType) => {
    setFormData((prev) => ({
      ...prev,
      entityType,
      entityId: '',
      entityName: ''
    }));
  };

  const handleContentTypeChange = (contentType) => {
    setFormData((prev) => ({
      ...prev,
      contentType,
      mediaUrl: '',
      videoLink: ''
    }));
    setSelectedImageFile(null);
    setSelectedVideoFile(null);
    setUploadProgress(0);
  };

  const handleImageSelection = (file) => {
    if (!file) {
      setSelectedImageFile(null);
      return;
    }
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      showError('Invalid image', validation.error);
      return;
    }
    setSelectedImageFile(file);
    setSelectedVideoFile(null);
  };

  const handleVideoSelection = (file) => {
    if (!file) {
      setSelectedVideoFile(null);
      return;
    }
    if (!file.type.startsWith('video/')) {
      showError('Invalid video', 'Please select a valid video file');
      return;
    }
    setSelectedVideoFile(file);
    setSelectedImageFile(null);
  };

  const handleCreateStory = async (event) => {
    event.preventDefault();
    if (!isAdmin || !user) {
      showError('Permission denied', 'Only admins can post PitchSnaps');
      return;
    }

    const contentType = formData.contentType;
    const text = (formData.text || '').trim();

    if (contentType === 'text' && !text) {
      showError('Missing text', 'Text PitchSnaps require a message');
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);

    try {
      let mediaUrl = formData.mediaUrl?.trim() || '';
      let videoLink = formData.videoLink?.trim() || '';

      if (contentType === 'image') {
        if (selectedImageFile) {
          mediaUrl = await uploadImage(selectedImageFile, 'stories', `story_${user.uid}_${Date.now()}`);
        }
        if (!mediaUrl) {
          throw new Error('Please upload an image or provide an image URL');
        }
      }

      if (contentType === 'video') {
        if (selectedVideoFile) {
          mediaUrl = await uploadVideoWithProgress(
            selectedVideoFile,
            'stories',
            (progress) => setUploadProgress(progress)
          );
        }
        if (!mediaUrl) {
          throw new Error('Please upload a video or provide a video URL');
        }
      }

      if (contentType === 'video_link' && !videoLink) {
        throw new Error('Please provide a video link');
      }

      const selectedEntity = (entityOptions[formData.entityType] || [])
        .find((option) => option.id === String(formData.entityId));
      const ownerName = user.displayName || user.name || user.email || 'Admin';
      const resolvedEntityName = formData.entityType === 'admin'
        ? (selectedEntity?.label || ownerName)
        : (selectedEntity?.label || STORY_ENTITY_LABEL[formData.entityType] || 'General');
      const resolvedEntityId = formData.entityType === 'admin'
        ? (formData.entityId || user.uid)
        : (formData.entityId || null);

      await storiesCollection.add({
        ownerId: user.uid,
        ownerName,
        contentType,
        text,
        mediaUrl,
        videoLink,
        durationHours: Number(formData.durationHours) === 48 ? 48 : 24,
        entityType: formData.entityType,
        entityId: resolvedEntityId,
        entityName: resolvedEntityName,
        style: {
          backgroundColor: formData.backgroundColor,
          textColor: formData.textColor,
          fontFamily: formData.fontFamily
        }
      });

      showSuccess('PitchSnap posted', 'Your status update is now live');
      resetComposer();
      setShowComposer(false);
    } catch (error) {
      showError('Could not post PitchSnap', error.message || 'Please try again');
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteStory = async () => {
    if (!currentStory || !isAdmin || !user) return;
    const canDelete = user.isSuperAdmin || String(currentStory.ownerId || '') === String(user.uid);
    if (!canDelete) {
      showError('Permission denied', 'You can only delete your own PitchSnaps');
      return;
    }

    try {
      await storiesCollection.delete(currentStory.id);
      showSuccess('PitchSnap deleted', 'The update has been removed');
    } catch (error) {
      showError('Delete failed', error.message || 'Please try again');
    }
  };

  const renderStoryContent = (story) => {
    if (!story) return null;

    const storyText = story.text || '';
    if (story.contentType === 'text') {
      return (
        <div
          className="h-full w-full flex items-center justify-center p-8 text-center"
          style={{
            backgroundColor: story?.style?.backgroundColor || '#1f2937',
            color: story?.style?.textColor || '#ffffff',
            fontFamily: story?.style?.fontFamily || 'inherit'
          }}
        >
          <p className="text-2xl md:text-3xl font-bold leading-tight break-words">{storyText}</p>
        </div>
      );
    }

    if (story.contentType === 'image') {
      return (
        <div className="h-full w-full relative bg-black">
          {story.mediaUrl ? (
            <img src={story.mediaUrl} alt="PitchSnap" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-300">
              <ImageIcon className="w-10 h-10" />
            </div>
          )}
          {storyText && (
            <div className="absolute inset-x-0 bottom-0 bg-black/55 p-4 text-white text-sm md:text-base">
              {storyText}
            </div>
          )}
        </div>
      );
    }

    if (story.contentType === 'video') {
      return (
        <div className="h-full w-full relative bg-black">
          {story.mediaUrl ? (
            <video src={story.mediaUrl} className="h-full w-full object-cover" autoPlay muted playsInline />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-300">
              <Video className="w-10 h-10" />
            </div>
          )}
          {storyText && (
            <div className="absolute inset-x-0 bottom-0 bg-black/55 p-4 text-white text-sm md:text-base">
              {storyText}
            </div>
          )}
        </div>
      );
    }

    if (story.contentType === 'video_link') {
      const embedUrl = getEmbedUrl(story.videoLink || '');
      return (
        <div className="h-full w-full relative bg-black">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title="PitchSnap Video"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center gap-3 text-white px-6 text-center">
              <PlayCircle className="w-12 h-12" />
              <a
                href={story.videoLink}
                target="_blank"
                rel="noreferrer"
                className="text-brand-purple underline break-all"
              >
                Open video link
              </a>
            </div>
          )}
          {storyText && (
            <div className="absolute inset-x-0 bottom-0 bg-black/60 p-4 text-white text-sm md:text-base">
              {storyText}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const currentExpiresInHours = currentStory?.expiresAt
    ? Math.max(0, Math.ceil((new Date(currentStory.expiresAt).getTime() - Date.now()) / (60 * 60 * 1000)))
    : null;

  return (
    <div className="min-h-screen px-4 pb-28 space-y-4">
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center">
          <PitchSnapLogo showText />
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={handleComposerToggle}
              className="inline-flex items-center gap-2 rounded-full bg-brand-purple px-3 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
            >
              {showComposer ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showComposer ? 'Close' : 'Post'}
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full border border-white/15 px-3 py-2 text-xs text-gray-200 hover:bg-white/5"
          >
            Back
          </button>
        </div>
      </div>

      {showComposer && isAdmin && (
        <form onSubmit={handleCreateStory} className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Plus className="w-4 h-4" />
            Create PitchSnap Update
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-xs text-gray-300">
              PitchSnap Type
              <select
                className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
                value={formData.contentType}
                onChange={(event) => handleContentTypeChange(event.target.value)}
              >
                <option value="text">Text</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="video_link">Video Link</option>
              </select>
            </label>

            <label className="space-y-1 text-xs text-gray-300">
              Duration
              <select
                className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
                value={formData.durationHours}
                onChange={(event) => setFormData((prev) => ({ ...prev, durationHours: Number(event.target.value) }))}
              >
                <option value={24}>24 hours</option>
                <option value={48}>48 hours (max)</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-xs text-gray-300">
              Target Entity
              <select
                className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
                value={formData.entityType}
                onChange={(event) => handleEntityTypeChange(event.target.value)}
              >
                <option value="season">Season</option>
                <option value="competition">Competition</option>
                <option value="fixture">Fixture</option>
                <option value="league">League</option>
                <option value="admin">Admin</option>
                <option value="team">Team</option>
                <option value="general">General</option>
              </select>
            </label>

            <label className="space-y-1 text-xs text-gray-300">
              {formData.entityType === 'general' ? 'Entity' : `Select ${STORY_ENTITY_LABEL[formData.entityType] || 'Entity'}`}
              <select
                className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
                value={formData.entityId}
                onChange={(event) => setFormData((prev) => ({ ...prev, entityId: event.target.value }))}
                disabled={formData.entityType === 'general'}
              >
                <option value="">
                  {formData.entityType === 'general' ? 'Not required' : 'Select one'}
                </option>
                {(entityOptions[formData.entityType] || []).map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="space-y-1 text-xs text-gray-300 block">
            PitchSnap Text / Caption
            <textarea
              value={formData.text}
              onChange={(event) => setFormData((prev) => ({ ...prev, text: event.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
              placeholder="Write a status update..."
            />
          </label>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="space-y-1 text-xs text-gray-300">
              Background
              <input
                type="color"
                value={formData.backgroundColor}
                onChange={(event) => setFormData((prev) => ({ ...prev, backgroundColor: event.target.value }))}
                className="h-10 w-full rounded-lg border border-white/15 bg-black/30 px-1"
              />
            </label>
            <label className="space-y-1 text-xs text-gray-300">
              Text Color
              <input
                type="color"
                value={formData.textColor}
                onChange={(event) => setFormData((prev) => ({ ...prev, textColor: event.target.value }))}
                className="h-10 w-full rounded-lg border border-white/15 bg-black/30 px-1"
              />
            </label>
            <label className="space-y-1 text-xs text-gray-300">
              Font
              <select
                value={formData.fontFamily}
                onChange={(event) => setFormData((prev) => ({ ...prev, fontFamily: event.target.value }))}
                className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
              >
                {FONT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {formData.contentType === 'image' && (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-xs text-gray-300">
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleImageSelection(event.target.files?.[0] || null)}
                  className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="space-y-1 text-xs text-gray-300">
                Or Image URL
                <input
                  type="url"
                  value={formData.mediaUrl}
                  onChange={(event) => setFormData((prev) => ({ ...prev, mediaUrl: event.target.value }))}
                  className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
                  placeholder="https://..."
                />
              </label>
            </div>
          )}

          {formData.contentType === 'video' && (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-xs text-gray-300">
                Upload Video
                <input
                  type="file"
                  accept="video/*"
                  onChange={(event) => handleVideoSelection(event.target.files?.[0] || null)}
                  className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="space-y-1 text-xs text-gray-300">
                Or Video URL
                <input
                  type="url"
                  value={formData.mediaUrl}
                  onChange={(event) => setFormData((prev) => ({ ...prev, mediaUrl: event.target.value }))}
                  className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
                  placeholder="https://..."
                />
              </label>
            </div>
          )}

          {formData.contentType === 'video_link' && (
            <label className="space-y-1 text-xs text-gray-300 block">
              Video Link
              <input
                type="url"
                value={formData.videoLink}
                onChange={(event) => setFormData((prev) => ({ ...prev, videoLink: event.target.value }))}
                className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
                placeholder="YouTube / Vimeo URL"
              />
            </label>
          )}

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full rounded-full bg-white/10 h-2 overflow-hidden">
              <div
                className="h-full bg-brand-purple transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-brand-purple px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              {submitting ? 'Posting...' : 'Post PitchSnap'}
            </button>
            <button
              type="button"
              onClick={resetComposer}
              className="rounded-full border border-white/15 px-4 py-2 text-sm text-gray-200 hover:bg-white/5"
            >
              Reset
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="min-h-[50vh] grid place-items-center">
          <div className="text-gray-400 text-sm">Loading PitchSnaps...</div>
        </div>
      ) : !currentStory ? (
        <div className="min-h-[50vh] rounded-3xl border border-white/10 bg-white/5 grid place-items-center p-8 text-center">
          <div className="space-y-3">
            <PlayCircle className="w-10 h-10 text-brand-purple mx-auto" />
            <h2 className="text-white text-lg font-semibold">No active PitchSnaps</h2>
            <p className="text-gray-400 text-sm">
              Admin status updates will appear here and expire automatically after 24-48 hours.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div
            className={`relative overflow-hidden border-y border-white/10 bg-black -mx-4 sm:mx-0 sm:rounded-3xl sm:border ${snapViewportHeightClass} min-h-[420px]`}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
          >
            <div className="absolute top-0 left-0 right-0 z-10 p-3 flex gap-1">
              {currentGroup.stories.map((story, index) => {
                const isCompleted = index < currentStoryIndex;
                const isActive = index === currentStoryIndex;
                return (
                  <div key={story.id} className="h-1 flex-1 rounded bg-white/25 overflow-hidden">
                    <div
                      className={`h-full ${isActive || isCompleted ? 'bg-white' : 'bg-transparent'}`}
                      style={{ width: isCompleted ? '100%' : isActive ? `${storyProgress}%` : '0%' }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="absolute top-4 left-4 right-4 z-10 mt-2 flex items-start justify-between gap-2 text-white">
              <div className="space-y-1">
                <div className="text-sm font-semibold">{currentStory.ownerName || 'Admin'}</div>
                <div className="text-xs text-white/80">
                  {STORY_ENTITY_LABEL[currentStory.entityType] || 'Update'} • {getEntityDisplayName(currentStory)}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2 text-[11px] text-white/85 bg-black/35 rounded-full px-2 py-1">
                  <Clock3 className="w-3 h-3" />
                  {currentExpiresInHours != null ? `${currentExpiresInHours}h left` : 'Live'}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-white/85 bg-black/35 rounded-full px-2 py-1">
                  <Eye className="w-3 h-3" />
                  {formatStoryViews(currentStoryViews)} views
                </div>
              </div>
            </div>

            <div
              className="absolute inset-0 z-20 flex"
              onMouseDown={handlePauseStart}
              onMouseUp={handlePauseEnd}
              onMouseLeave={handlePauseEnd}
            >
              <button
                type="button"
                aria-label="Previous snap"
                onClick={() => handleSnapTap('prev')}
                className="h-full w-1/2"
              />
              <button
                type="button"
                aria-label="Next snap"
                onClick={() => handleSnapTap('next')}
                className="h-full w-1/2"
              />
            </div>

            {renderStoryContent(currentStory)}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-300">
            <div className="flex items-center gap-2">
              {currentStory.contentType === 'text' && <Type className="w-3.5 h-3.5" />}
              {currentStory.contentType === 'image' && <ImageIcon className="w-3.5 h-3.5" />}
              {currentStory.contentType === 'video' && <Video className="w-3.5 h-3.5" />}
              {currentStory.contentType === 'video_link' && <LinkIcon className="w-3.5 h-3.5" />}
              <span>{String(currentStory.contentType || 'text').replace('_', ' ')}</span>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={handleDeleteStory}
                className="inline-flex items-center gap-1 rounded-full border border-red-400/40 px-2 py-1 text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Stories;
