/**
 * Convergence Form Extractor - Cloud Sync Storage Module
 * Manages persistent user state, tier configuration, and cross-device sync
 * transitioning the application from pure localStorage to full cloud database persistence.
 */

export interface CloudUserProfile {
  uid: string;
  displayName: string;
  curriculumWave: number;
  accountTier: 'free' | 'standard' | 'premium';
  email?: string;
  avatarIcon?: string;
  avatarColor?: string;
  archetype?: string;
  sphereDefaultSize?: 'standard' | 'majestic' | 'colossal';
  ambientMusicAutoPlay?: boolean;
  voiceChantAutoPlay?: boolean;
  totalBreathingMinutes?: number;
  completedOmCycles?: number;
  completedQuadraSyncCycles?: number;
  totalExercisesCompleted?: number;
  lastSyncedAt?: string;
}

export const DEFAULT_CLOUD_PROFILE: CloudUserProfile = {
  uid: 'user_123',
  displayName: 'Observer',
  curriculumWave: 1,
  accountTier: 'premium',
  email: 'anthonyc.22@axiomzetainnovations.com',
  avatarIcon: 'ॐ',
  avatarColor: '#f59e0b',
  archetype: 'Numinous Synthesizer & Architect',
  sphereDefaultSize: 'majestic',
  ambientMusicAutoPlay: true,
  voiceChantAutoPlay: true,
  totalBreathingMinutes: 48,
  completedOmCycles: 14,
  completedQuadraSyncCycles: 9,
  totalExercisesCompleted: 6
};

const LOCAL_STORAGE_PROFILE_KEY = 'convergence_cloud_user_profile_v1';
const LOCAL_STORAGE_PROFILES_LIST_KEY = 'convergence_cloud_profiles_list_v1';
const SYNC_EVENT_NAME = 'convergence:profile-cloud-sync';
const PROFILES_LIST_EVENT_NAME = 'convergence:profiles-list-sync';

/**
 * Get the list of all saved local profiles
 */
export function listLocalProfiles(): CloudUserProfile[] {
  if (typeof window === 'undefined') return [DEFAULT_CLOUD_PROFILE];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PROFILES_LIST_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    }
  } catch {
    // ignore parse error
  }
  // If list empty, seed with current active profile
  const active = getLocalCachedProfile();
  saveLocalProfilesList([active]);
  return [active];
}

/**
 * Save the entire list of profiles to localStorage
 */
function saveLocalProfilesList(list: CloudUserProfile[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_PROFILES_LIST_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(PROFILES_LIST_EVENT_NAME, { detail: list }));
  } catch {
    // ignore
  }
}

/**
 * Get current profile cached in memory or localStorage
 */
export function getLocalCachedProfile(): CloudUserProfile {
  if (typeof window === 'undefined') return DEFAULT_CLOUD_PROFILE;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_CLOUD_PROFILE, ...parsed };
    }
  } catch {
    // ignore parse error
  }
  return DEFAULT_CLOUD_PROFILE;
}

/**
 * Save profile to local storage cache immediately and update in profiles list
 */
export function setLocalCachedProfile(profile: CloudUserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(profile));

    // Update in profiles list
    const currentList = listLocalProfiles();
    const index = currentList.findIndex(p => p.uid === profile.uid);
    let updatedList: CloudUserProfile[];
    if (index >= 0) {
      updatedList = [...currentList];
      updatedList[index] = profile;
    } else {
      updatedList = [profile, ...currentList];
    }
    saveLocalProfilesList(updatedList);

    window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME, { detail: profile }));
  } catch {
    // ignore
  }
}

/**
 * Create a new user profile, save it locally, sync to cloud, and switch to it
 */
export async function createNewProfile(data: {
  displayName: string;
  email?: string;
  archetype?: string;
  avatarIcon?: string;
  avatarColor?: string;
  accountTier?: 'free' | 'standard' | 'premium';
  curriculumWave?: number;
  sphereDefaultSize?: 'standard' | 'majestic' | 'colossal';
}): Promise<CloudUserProfile> {
  const newUid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newProfile: CloudUserProfile = {
    uid: newUid,
    displayName: data.displayName.trim() || 'New Persona',
    email: data.email?.trim() || '',
    archetype: data.archetype?.trim() || 'Divergent Ideator & Architect',
    avatarIcon: data.avatarIcon || '✨',
    avatarColor: data.avatarColor || '#38bdf8',
    accountTier: data.accountTier || 'premium',
    curriculumWave: data.curriculumWave || 1,
    sphereDefaultSize: data.sphereDefaultSize || 'majestic',
    ambientMusicAutoPlay: true,
    voiceChantAutoPlay: true,
    totalBreathingMinutes: 0,
    completedOmCycles: 0,
    completedQuadraSyncCycles: 0,
    totalExercisesCompleted: 0,
    lastSyncedAt: new Date().toISOString()
  };

  // Set active and save to list
  setLocalCachedProfile(newProfile);

  // Sync to backend cloud endpoint
  try {
    await syncProfileToCloud(newProfile);
  } catch (err) {
    console.warn('Cloud sync of new profile offline, saved locally:', err);
  }

  return newProfile;
}

/**
 * Switch the active profile to an existing profile by UID
 */
export function switchActiveProfile(uid: string): CloudUserProfile | null {
  const list = listLocalProfiles();
  const target = list.find(p => p.uid === uid);
  if (target) {
    setLocalCachedProfile(target);
    return target;
  }
  return null;
}

/**
 * Delete a profile by UID (cannot delete if it's the last remaining profile)
 */
export async function deleteProfileById(uid: string): Promise<CloudUserProfile> {
  const list = listLocalProfiles();
  if (list.length <= 1) {
    throw new Error('Cannot delete the only remaining profile. Create another profile first.');
  }

  const updatedList = list.filter(p => p.uid !== uid);
  saveLocalProfilesList(updatedList);

  // Notify backend
  try {
    await fetch(`/api/user/profile?uid=${encodeURIComponent(uid)}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.warn('Failed to delete profile from cloud:', err);
  }

  // If the deleted profile was active, switch to first available
  const currentActive = getLocalCachedProfile();
  if (currentActive.uid === uid) {
    const nextActive = updatedList[0];
    setLocalCachedProfile(nextActive);
    return nextActive;
  }

  return currentActive;
}

/**
 * Fetch all profiles from Cloud backend and merge with local list
 */
export async function fetchAllCloudProfiles(): Promise<CloudUserProfile[]> {
  try {
    const res = await fetch('/api/user/profiles', {
      headers: { Accept: 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.profiles) && data.profiles.length > 0) {
        const localList = listLocalProfiles();
        const mergedMap = new Map<string, CloudUserProfile>();

        // Add local first
        for (const lp of localList) {
          mergedMap.set(lp.uid, lp);
        }

        // Merge or add cloud
        for (const cp of data.profiles) {
          const existing = mergedMap.get(cp.uid);
          mergedMap.set(cp.uid, {
            uid: cp.uid,
            displayName: cp.displayName || existing?.displayName || 'Observer',
            curriculumWave: Number(cp.curriculumWave ?? existing?.curriculumWave ?? 1),
            accountTier: cp.accountTier || existing?.accountTier || 'premium',
            email: cp.email || existing?.email,
            avatarIcon: cp.profileData?.avatarIcon || existing?.avatarIcon || 'ॐ',
            avatarColor: cp.profileData?.avatarColor || existing?.avatarColor || '#f59e0b',
            archetype: cp.profileData?.archetype || existing?.archetype || 'Numinous Synthesizer',
            sphereDefaultSize: cp.profileData?.sphereDefaultSize || existing?.sphereDefaultSize || 'majestic',
            ambientMusicAutoPlay: cp.profileData?.ambientMusicAutoPlay ?? existing?.ambientMusicAutoPlay ?? true,
            voiceChantAutoPlay: cp.profileData?.voiceChantAutoPlay ?? existing?.voiceChantAutoPlay ?? true,
            totalBreathingMinutes: cp.profileData?.totalBreathingMinutes ?? existing?.totalBreathingMinutes ?? 0,
            completedOmCycles: cp.profileData?.completedOmCycles ?? existing?.completedOmCycles ?? 0,
            completedQuadraSyncCycles: cp.profileData?.completedQuadraSyncCycles ?? existing?.completedQuadraSyncCycles ?? 0,
            totalExercisesCompleted: cp.profileData?.totalExercisesCompleted ?? existing?.totalExercisesCompleted ?? 0,
            lastSyncedAt: new Date().toISOString()
          });
        }

        const mergedList = Array.from(mergedMap.values());
        saveLocalProfilesList(mergedList);
        return mergedList;
      }
    }
  } catch (err) {
    console.warn('Unable to fetch cloud profiles list:', err);
  }
  return listLocalProfiles();
}

/**
 * Subscribe to profiles list updates
 */
export function subscribeToProfilesListSync(callback: (list: CloudUserProfile[]) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const custom = e as CustomEvent<CloudUserProfile[]>;
    if (custom.detail) callback(custom.detail);
  };
  window.addEventListener(PROFILES_LIST_EVENT_NAME, handler);
  return () => window.removeEventListener(PROFILES_LIST_EVENT_NAME, handler);
}

/**
 * Fetch profile from Cloud Sync endpoint (PostgreSQL backed)
 */
export async function fetchCloudProfile(): Promise<CloudUserProfile> {
  const cached = getLocalCachedProfile();
  try {
    const res = await fetch(`/api/user/profile?uid=${encodeURIComponent(cached.uid)}`, {
      headers: { Accept: 'application/json' }
    });
    if (res.ok) {
      const cloudData = await res.json();
      const merged: CloudUserProfile = {
        ...cached,
        uid: cloudData.uid || cached.uid,
        displayName: cloudData.displayName || cached.displayName,
        curriculumWave: Number(cloudData.curriculumWave ?? cached.curriculumWave),
        accountTier: cloudData.accountTier || cached.accountTier,
        email: cloudData.email || cached.email,
        ...(cloudData.profileData || {}),
        lastSyncedAt: new Date().toISOString()
      };
      setLocalCachedProfile(merged);
      return merged;
    }
  } catch (error) {
    console.warn('Cloud sync offline or unavailable, using local cache:', error);
  }
  return cached;
}

/**
 * Push profile updates to Cloud Sync backend
 */
export async function syncProfileToCloud(updates: Partial<CloudUserProfile>): Promise<CloudUserProfile> {
  const current = getLocalCachedProfile();
  const updated: CloudUserProfile = {
    ...current,
    ...updates,
    lastSyncedAt: new Date().toISOString()
  };

  // Optimistic local update
  setLocalCachedProfile(updated);

  try {
    const res = await fetch('/api/user/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: updated.uid,
        displayName: updated.displayName,
        curriculumWave: updated.curriculumWave,
        accountTier: updated.accountTier,
        email: updated.email,
        profileData: {
          avatarIcon: updated.avatarIcon,
          avatarColor: updated.avatarColor,
          archetype: updated.archetype,
          sphereDefaultSize: updated.sphereDefaultSize,
          ambientMusicAutoPlay: updated.ambientMusicAutoPlay,
          voiceChantAutoPlay: updated.voiceChantAutoPlay,
          totalBreathingMinutes: updated.totalBreathingMinutes,
          completedOmCycles: updated.completedOmCycles,
          completedQuadraSyncCycles: updated.completedQuadraSyncCycles,
          totalExercisesCompleted: updated.totalExercisesCompleted
        }
      })
    });

    if (res.ok) {
      const responseData = await res.json();
      if (responseData.profile) {
        const finalProfile: CloudUserProfile = {
          ...updated,
          uid: responseData.profile.uid,
          displayName: responseData.profile.displayName,
          curriculumWave: responseData.profile.curriculumWave,
          accountTier: responseData.profile.accountTier,
          email: responseData.profile.email,
          ...(responseData.profile.profileData || {}),
          lastSyncedAt: new Date().toISOString()
        };
        setLocalCachedProfile(finalProfile);
        return finalProfile;
      }
    }
  } catch (err) {
    console.warn('Unable to push cloud sync update, local copy preserved:', err);
  }

  return updated;
}

/**
 * Subscribe to cross-tab or cross-component profile updates
 */
export function subscribeToProfileSync(callback: (profile: CloudUserProfile) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const custom = e as CustomEvent<CloudUserProfile>;
    if (custom.detail) callback(custom.detail);
  };
  window.addEventListener(SYNC_EVENT_NAME, handler);
  return () => window.removeEventListener(SYNC_EVENT_NAME, handler);
}
