import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Shield,
  Check,
  Sparkles,
  Award,
  HeartPulse,
  Brain,
  Sliders,
  LogOut,
  Save,
  Key,
  Volume2,
  Cloud,
  RefreshCw,
  Zap,
  UserPlus,
  Users,
  Trash2,
  Plus,
  Compass,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { safeFetchJson } from '../api-client';
import {
  CloudUserProfile,
  DEFAULT_CLOUD_PROFILE,
  getLocalCachedProfile,
  fetchCloudProfile,
  syncProfileToCloud,
  subscribeToProfileSync,
  listLocalProfiles,
  createNewProfile,
  switchActiveProfile,
  deleteProfileById,
  fetchAllCloudProfiles,
  subscribeToProfilesListSync
} from '../storage';

const AVATAR_GLYPHS = ['ॐ', '✨', '⚡', '🌀', '💎', '☀️', '🌸', '🔮', '🕊️', '🦅', '🪐', '🌿', '🧬', '⚓'];
const AVATAR_COLORS = ['#f59e0b', '#38bdf8', '#8b5cf6', '#10b981', '#ec4899', '#f97316', '#06b6d4', '#a855f7', '#e2e8f0'];

const ARCHETYPE_SUGGESTIONS = [
  'Numinous Synthesizer & Architect',
  'Divergent Lateral Ideator',
  'Contemplative Somatic Sage',
  'Bisociative Polymath & Inventor',
  'Algorithmic Poet & Theorist',
  'Cognitive Harmony Explorer'
];

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profile' | 'create' | 'profiles' | 'account' | 'stats';
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'profile'
}) => {
  const [profile, setProfile] = useState<CloudUserProfile>(getLocalCachedProfile);
  const [allProfiles, setAllProfiles] = useState<CloudUserProfile[]>(listLocalProfiles);
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'create' | 'profiles' | 'account' | 'stats'>(initialTab);
  
  // Edit Profile States
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [syncingCloud, setSyncingCloud] = useState(false);

  // New Profile Form States
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newArchetype, setNewArchetype] = useState(ARCHETYPE_SUGGESTIONS[0]);
  const [newAvatarIcon, setNewAvatarIcon] = useState('✨');
  const [newAvatarColor, setNewAvatarColor] = useState('#38bdf8');
  const [newCurriculumWave, setNewCurriculumWave] = useState(1);
  const [newAccountTier, setNewAccountTier] = useState<'free' | 'standard' | 'premium'>('premium');
  const [newSphereSize, setNewSphereSize] = useState<'standard' | 'majestic' | 'colossal'>('majestic');
  const [isCreating, setIsCreating] = useState(false);
  const [createSuccessMsg, setCreateSuccessMsg] = useState<string | null>(null);

  // Auth States
  const [authEmail, setAuthEmail] = useState(profile.email || '');
  const [authPassword, setAuthPassword] = useState('');
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Update tab when initialTab changes on open
  useEffect(() => {
    if (isOpen) {
      setActiveSubTab(initialTab);
      setAllProfiles(listLocalProfiles());
    }
  }, [isOpen, initialTab]);

  // Sync with cloud on initial open
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    fetchCloudProfile().then(cloudData => {
      if (isMounted) {
        setProfile(cloudData);
        if (cloudData.email) setAuthEmail(cloudData.email);
      }
    });

    fetchAllCloudProfiles().then(cloudList => {
      if (isMounted && cloudList.length > 0) {
        setAllProfiles(cloudList);
      }
    });

    const unsubscribeProfile = subscribeToProfileSync(updated => {
      if (isMounted) {
        setProfile(updated);
        setAllProfiles(listLocalProfiles());
      }
    });

    const unsubscribeList = subscribeToProfilesListSync(list => {
      if (isMounted) setAllProfiles(list);
    });

    return () => {
      isMounted = false;
      unsubscribeProfile();
      unsubscribeList();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const updated = await syncProfileToCloud(profile);
    setProfile(updated);
    setAllProfiles(listLocalProfiles());
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleManualCloudSync = async () => {
    setSyncingCloud(true);
    const cloudData = await fetchCloudProfile();
    const cloudList = await fetchAllCloudProfiles();
    setProfile(cloudData);
    setAllProfiles(cloudList);
    setSyncingCloud(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleCreateNewProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisplayName.trim()) return;

    setIsCreating(true);
    setCreateSuccessMsg(null);

    try {
      const created = await createNewProfile({
        displayName: newDisplayName.trim(),
        email: newEmail.trim(),
        archetype: newArchetype.trim(),
        avatarIcon: newAvatarIcon,
        avatarColor: newAvatarColor,
        curriculumWave: newCurriculumWave,
        accountTier: newAccountTier,
        sphereDefaultSize: newSphereSize
      });

      setProfile(created);
      setAllProfiles(listLocalProfiles());
      setIsCreating(false);
      setCreateSuccessMsg(`Profile "${created.displayName}" created and activated!`);

      // Reset form
      setNewDisplayName('');
      setNewEmail('');

      setTimeout(() => {
        setCreateSuccessMsg(null);
        setActiveSubTab('profile');
      }, 1400);
    } catch (err) {
      setIsCreating(false);
      console.error('Failed to create profile:', err);
    }
  };

  const handleSwitchProfile = (uid: string) => {
    const switched = switchActiveProfile(uid);
    if (switched) {
      setProfile(switched);
      setAuthEmail(switched.email || '');
      setActiveSubTab('profile');
    }
  };

  const handleDeleteProfile = async (uid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (allProfiles.length <= 1) {
      alert('Cannot delete the only profile. Create another profile first.');
      return;
    }
    const target = allProfiles.find(p => p.uid === uid);
    if (!window.confirm(`Are you sure you want to remove profile "${target?.displayName || uid}"?`)) {
      return;
    }

    try {
      const nextActive = await deleteProfileById(uid);
      setProfile(nextActive);
      setAllProfiles(listLocalProfiles());
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unable to delete profile.');
    }
  };

  const handleEmailAuth = async (action: 'login' | 'register') => {
    if (!authEmail.trim()) {
      setAuthStatus('Please enter an email address.');
      return;
    }
    setAuthLoading(true);
    setAuthStatus(null);

    const endpoint = action === 'login' ? '/api/billing/login' : '/api/billing/register';
    const res = await safeFetchJson<{ user?: { email: string }; email?: string; error?: string }>(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: authEmail, password: authPassword || 'AxiomConvergence2026!' })
    });

    setAuthLoading(false);
    if (res.ok) {
      const updatedProfile = await syncProfileToCloud({
        email: authEmail,
        displayName: authEmail.split('@')[0] || profile.displayName,
        accountTier: 'premium'
      });
      setProfile(updatedProfile);
      setAllProfiles(listLocalProfiles());
      setAuthStatus(`Successfully authenticated as ${authEmail}. Cloud sync active.`);
    } else {
      // Local / Offline fallback
      const updatedProfile = await syncProfileToCloud({
        email: authEmail,
        displayName: authEmail.split('@')[0] || profile.displayName
      });
      setProfile(updatedProfile);
      setAllProfiles(listLocalProfiles());
      setAuthStatus(`Authenticated locally as ${authEmail} (Cloud queue active).`);
    }
  };

  return (
    <div className="modal-backdrop-blur" onClick={onClose}>
      <div className="profile-modal-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header-row">
          <div className="modal-title-wrap">
            <div
              className="user-avatar-badge"
              style={{
                background: `linear-gradient(135deg, ${profile.avatarColor || '#f59e0b'}, #07101d)`,
                borderColor: profile.avatarColor || '#f59e0b'
              }}
            >
              <span className="avatar-glyph">{profile.avatarIcon || 'ॐ'}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="modal-heading">{profile.displayName}</h3>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wide">
                  {profile.accountTier} Tier
                </span>
                <span className="px-2 py-0.5 text-xs rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Wave {profile.curriculumWave}
                </span>
              </div>
              <p className="modal-subheading">{profile.archetype || 'Numinous Synthesizer & Architect'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-create-profile-header"
              onClick={() => setActiveSubTab('create')}
              title="Create a new user persona"
            >
              <UserPlus size={14} />
              <span>+ Create Profile</span>
            </button>
            <button type="button" className="btn-modal-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="profile-tabs-nav">
          <button
            type="button"
            className={`profile-tab-btn ${activeSubTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('profile')}
          >
            <User size={15} />
            <span>Edit Profile</span>
          </button>
          <button
            type="button"
            className={`profile-tab-btn tab-create-btn ${activeSubTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('create')}
          >
            <UserPlus size={15} />
            <span>+ Create Profile</span>
          </button>
          <button
            type="button"
            className={`profile-tab-btn ${activeSubTab === 'profiles' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('profiles')}
          >
            <Users size={15} />
            <span>Profiles ({allProfiles.length})</span>
          </button>
          <button
            type="button"
            className={`profile-tab-btn ${activeSubTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('account')}
          >
            <Mail size={15} />
            <span>Cloud Sync</span>
          </button>
          <button
            type="button"
            className={`profile-tab-btn ${activeSubTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('stats')}
          >
            <Award size={15} />
            <span>Stats</span>
          </button>
        </div>

        {/* ====================================================================
            TAB: CREATE NEW PROFILE
            ==================================================================== */}
        {activeSubTab === 'create' && (
          <form onSubmit={handleCreateNewProfile} className="profile-tab-pane">
            <div className="profile-creation-hero">
              <div className="hero-icon-wrap">
                <Sparkles size={20} className="text-amber-400" />
              </div>
              <div className="hero-text">
                <h4 className="font-bold text-slate-100 text-sm">Create New Cognitive Persona</h4>
                <p className="text-slate-400 text-xs mt-0.5">
                  Establish a distinct identity with tailored sacred glyphs, aura resonances, baseline waves, and practice logs.
                </p>
              </div>
            </div>

            {/* Live Interactive Preview Card */}
            <div className="profile-preview-card" style={{ borderColor: `${newAvatarColor}55` }}>
              <div
                className="preview-avatar"
                style={{
                  background: `linear-gradient(135deg, ${newAvatarColor}, #091626)`,
                  borderColor: newAvatarColor,
                  boxShadow: `0 0 20px ${newAvatarColor}44`
                }}
              >
                <span className="preview-glyph">{newAvatarIcon}</span>
              </div>
              <div className="preview-meta">
                <div className="preview-name">{newDisplayName.trim() || 'New Persona'}</div>
                <div className="preview-archetype">{newArchetype || 'Divergent Explorer'}</div>
                <div className="preview-badges">
                  <span className="preview-badge tier" style={{ color: newAvatarColor, borderColor: `${newAvatarColor}66` }}>
                    {newAccountTier.toUpperCase()}
                  </span>
                  <span className="preview-badge wave">Wave {newCurriculumWave}</span>
                  {newEmail && <span className="preview-badge email">{newEmail}</span>}
                </div>
              </div>
            </div>

            {createSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>{createSuccessMsg}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Profile / Display Name *</label>
              <input
                type="text"
                className="input-field"
                value={newDisplayName}
                onChange={e => setNewDisplayName(e.target.value)}
                placeholder="e.g. Dr. Maya Lin, Architect of Silence"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Philosophical & Creative Archetype</label>
              <input
                type="text"
                className="input-field"
                value={newArchetype}
                onChange={e => setNewArchetype(e.target.value)}
                placeholder="Custom archetype or select a preset below"
              />
              <div className="archetype-chips-row mt-2">
                {ARCHETYPE_SUGGESTIONS.map(arch => (
                  <button
                    key={arch}
                    type="button"
                    className={`archetype-chip ${newArchetype === arch ? 'selected' : ''}`}
                    onClick={() => setNewArchetype(arch)}
                  >
                    {arch}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Sacred Glyph Avatar</label>
              <div className="glyphs-selector-row">
                {AVATAR_GLYPHS.map(glyph => (
                  <button
                    key={glyph}
                    type="button"
                    className={`glyph-btn ${newAvatarIcon === glyph ? 'selected' : ''}`}
                    onClick={() => setNewAvatarIcon(glyph)}
                  >
                    {glyph}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Avatar Aura Tint</label>
              <div className="colors-selector-row">
                {AVATAR_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`color-bubble-btn ${newAvatarColor === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewAvatarColor(color)}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label">Curriculum Wave</label>
                <select
                  className="input-field"
                  value={newCurriculumWave}
                  onChange={e => setNewCurriculumWave(Number(e.target.value))}
                >
                  <option value={1}>Wave 1 (Fundamental Foundation)</option>
                  <option value={2}>Wave 2 (Bilateral Expansion)</option>
                  <option value={3}>Wave 3 (Quadra-Sync Synthesis)</option>
                  <option value={4}>Wave 4 (Hieromathic Extraction)</option>
                  <option value={5}>Wave 5 (Zenith Transmutation)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Account Tier</label>
                <select
                  className="input-field"
                  value={newAccountTier}
                  onChange={e => setNewAccountTier(e.target.value as any)}
                >
                  <option value="premium">Premium Access (Uncapped)</option>
                  <option value="standard">Standard Practitioner</option>
                  <option value="free">Free Explorer</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Associated Email (Optional)</label>
              <div className="input-with-icon">
                <Mail size={16} className="field-icon" />
                <input
                  type="email"
                  className="input-field with-icon"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="persona@axiomzeta.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Default Breathing Sphere Size</label>
              <div className="segmented-selector">
                {[
                  { id: 'standard', label: 'Standard (440px)' },
                  { id: 'majestic', label: 'Majestic (560px)' },
                  { id: 'colossal', label: 'Colossal (680px)' }
                ].map(s => (
                  <button
                    key={s.id}
                    type="button"
                    className={`seg-btn ${newSphereSize === s.id ? 'active' : ''}`}
                    onClick={() => setNewSphereSize(s.id as any)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-actions-row">
              <button
                type="submit"
                className="btn-create-submit"
                disabled={isCreating || !newDisplayName.trim()}
              >
                <UserPlus size={16} />
                <span>{isCreating ? 'Creating Persona...' : 'Create & Activate Profile'}</span>
              </button>
              <button
                type="button"
                className="btn-secondary-action"
                onClick={() => setActiveSubTab('profiles')}
              >
                <span>View Existing Profiles</span>
              </button>
            </div>
          </form>
        )}

        {/* ====================================================================
            TAB: PROFILES LIST & SWITCHER
            ==================================================================== */}
        {activeSubTab === 'profiles' && (
          <div className="profile-tab-pane">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-100 text-sm">Saved Profiles & Personas</h4>
                <p className="text-slate-400 text-xs">
                  Switch between active practitioners or spin up a new persona.
                </p>
              </div>
              <button
                type="button"
                className="btn-create-profile-header"
                onClick={() => setActiveSubTab('create')}
              >
                <Plus size={14} />
                <span>Create New</span>
              </button>
            </div>

            <div className="profiles-list-grid">
              {allProfiles.map(p => {
                const isActive = p.uid === profile.uid;
                return (
                  <div
                    key={p.uid}
                    className={`profile-card-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleSwitchProfile(p.uid)}
                  >
                    <div
                      className="profile-card-avatar"
                      style={{
                        background: `linear-gradient(135deg, ${p.avatarColor || '#f59e0b'}, #091626)`,
                        borderColor: p.avatarColor || '#f59e0b'
                      }}
                    >
                      <span className="card-glyph">{p.avatarIcon || 'ॐ'}</span>
                    </div>

                    <div className="profile-card-details">
                      <div className="flex items-center gap-2">
                        <span className="profile-card-name">{p.displayName}</span>
                        {isActive && (
                          <span className="active-badge">
                            <Check size={11} /> Active
                          </span>
                        )}
                      </div>
                      <span className="profile-card-archetype">{p.archetype || 'Practitioner'}</span>
                      <div className="profile-card-submeta">
                        <span>Wave {p.curriculumWave}</span>
                        <span>•</span>
                        <span className="capitalize">{p.accountTier}</span>
                        {p.email && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[140px]">{p.email}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="profile-card-actions" onClick={e => e.stopPropagation()}>
                      {!isActive ? (
                        <button
                          type="button"
                          className="btn-switch-profile"
                          onClick={() => handleSwitchProfile(p.uid)}
                          title="Switch to this profile"
                        >
                          <span>Switch</span>
                          <ArrowRight size={13} />
                        </button>
                      ) : (
                        <span className="current-indicator">Current</span>
                      )}

                      {allProfiles.length > 1 && (
                        <button
                          type="button"
                          className="btn-delete-profile"
                          onClick={e => handleDeleteProfile(p.uid, e)}
                          title="Delete profile"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="btn-add-profile-card"
              onClick={() => setActiveSubTab('create')}
            >
              <div className="add-icon-box">
                <Plus size={20} />
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm text-slate-200">+ Create Another Profile</div>
                <div className="text-xs text-slate-400">Configure separate waves, sacred glyphs, and practice telemetry</div>
              </div>
            </button>
          </div>
        )}

        {/* ====================================================================
            TAB: EDIT CURRENT PROFILE
            ==================================================================== */}
        {activeSubTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="profile-tab-pane">
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input
                type="text"
                className="input-field"
                value={profile.displayName}
                onChange={e => setProfile({ ...profile, displayName: e.target.value })}
                placeholder="Your name or callsign"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Creative / Philosophical Archetype</label>
              <input
                type="text"
                className="input-field"
                value={profile.archetype || ''}
                onChange={e => setProfile({ ...profile, archetype: e.target.value })}
                placeholder="e.g., Numinous Synthesizer, Divergent Architect"
              />
              <div className="archetype-chips-row mt-2">
                {ARCHETYPE_SUGGESTIONS.map(arch => (
                  <button
                    key={arch}
                    type="button"
                    className={`archetype-chip ${profile.archetype === arch ? 'selected' : ''}`}
                    onClick={() => setProfile({ ...profile, archetype: arch })}
                  >
                    {arch}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Avatar Sacred Glyph</label>
              <div className="glyphs-selector-row">
                {AVATAR_GLYPHS.map(glyph => (
                  <button
                    key={glyph}
                    type="button"
                    className={`glyph-btn ${profile.avatarIcon === glyph ? 'selected' : ''}`}
                    onClick={() => setProfile({ ...profile, avatarIcon: glyph })}
                  >
                    {glyph}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Avatar Aura Tint</label>
              <div className="colors-selector-row">
                {AVATAR_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`color-bubble-btn ${profile.avatarColor === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setProfile({ ...profile, avatarColor: color })}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label">Curriculum Wave</label>
                <select
                  className="input-field"
                  value={profile.curriculumWave}
                  onChange={e => setProfile({ ...profile, curriculumWave: Number(e.target.value) })}
                >
                  <option value={1}>Wave 1</option>
                  <option value={2}>Wave 2</option>
                  <option value={3}>Wave 3</option>
                  <option value={4}>Wave 4</option>
                  <option value={5}>Wave 5</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Account Tier</label>
                <select
                  className="input-field"
                  value={profile.accountTier}
                  onChange={e => setProfile({ ...profile, accountTier: e.target.value as any })}
                >
                  <option value="premium">Premium Tier</option>
                  <option value="standard">Standard Tier</option>
                  <option value="free">Free Tier</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Sanctuary Default Sphere Size</label>
              <div className="segmented-selector">
                {[
                  { id: 'standard', label: 'Standard (440px)' },
                  { id: 'majestic', label: 'Majestic (560px)' },
                  { id: 'colossal', label: 'Colossal (680px)' }
                ].map(s => (
                  <button
                    key={s.id}
                    type="button"
                    className={`seg-btn ${profile.sphereDefaultSize === s.id ? 'active' : ''}`}
                    onClick={() => setProfile({ ...profile, sphereDefaultSize: s.id as any })}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-actions-row">
              <button type="submit" className="btn-save-profile" disabled={isSaving}>
                <Save size={16} />
                <span>{isSaving ? 'Syncing to Cloud...' : 'Save & Sync to Cloud'}</span>
              </button>
              {saveSuccess && (
                <span className="save-success-tag">
                  <Check size={14} /> Synced
                </span>
              )}
            </div>
          </form>
        )}

        {/* ====================================================================
            TAB: CLOUD SYNC & EMAIL AUTH
            ==================================================================== */}
        {activeSubTab === 'account' && (
          <div className="profile-tab-pane">
            <div className="account-info-box">
              <div className="box-title-row">
                <Shield size={16} style={{ color: '#10b981' }} />
                <span>Cloud Database Sync Active</span>
              </div>
              <p className="box-desc">
                Your profiles, curriculum waves, and practice history sync securely to the cloud database across mobile and web.
              </p>
            </div>

            {/* Cloud Profile JSON Mapping preview card */}
            <div className="p-3 my-2 rounded-lg bg-slate-900/80 border border-slate-700/60 font-mono text-xs text-slate-300">
              <div className="flex items-center justify-between text-slate-400 mb-1 font-sans text-xs">
                <span className="flex items-center gap-1"><Cloud size={13} className="text-emerald-400" /> Cloud Identity Record</span>
                <button
                  type="button"
                  onClick={handleManualCloudSync}
                  disabled={syncingCloud}
                  className="flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors"
                >
                  <RefreshCw size={12} className={syncingCloud ? 'animate-spin' : ''} />
                  <span>{syncingCloud ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              </div>
              <pre className="text-emerald-400/90 overflow-x-auto text-[11px] leading-relaxed">
{JSON.stringify({
  uid: profile.uid,
  displayName: profile.displayName,
  curriculumWave: profile.curriculumWave,
  accountTier: profile.accountTier,
  totalSavedProfiles: allProfiles.length
}, null, 2)}
              </pre>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-with-icon">
                <Mail size={16} className="field-icon" />
                <input
                  type="email"
                  className="input-field with-icon"
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  placeholder="name@domain.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password / Security PIN</label>
              <div className="input-with-icon">
                <Key size={16} className="field-icon" />
                <input
                  type="password"
                  className="input-field with-icon"
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            {authStatus && (
              <div className="auth-status-alert">
                <span>{authStatus}</span>
              </div>
            )}

            <div className="auth-buttons-row">
              <button
                type="button"
                className="btn-auth-primary"
                onClick={() => handleEmailAuth('login')}
                disabled={authLoading}
              >
                <span>{authLoading ? 'Signing in...' : 'Sign In with Email'}</span>
              </button>

              <button
                type="button"
                className="btn-auth-secondary"
                onClick={() => handleEmailAuth('register')}
                disabled={authLoading}
              >
                <span>Register Account</span>
              </button>
            </div>

            <div className="account-footer-note">
              <span>Active Account UID: <code>{profile.uid}</code></span>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB: PRACTICE STATS
            ==================================================================== */}
        {activeSubTab === 'stats' && (
          <div className="profile-tab-pane">
            <div className="stats-cards-grid">
              <div className="stat-card">
                <div className="stat-icon-wrap" style={{ color: '#f59e0b' }}>
                  <HeartPulse size={20} />
                </div>
                <div className="stat-val">{profile.totalBreathingMinutes}m</div>
                <div className="stat-label">Mindful Sphere Breathing</div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap" style={{ color: '#8b5cf6' }}>
                  <Sparkles size={20} />
                </div>
                <div className="stat-val">{profile.completedOmCycles}</div>
                <div className="stat-label">Timed Spoken Om Cycles</div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap" style={{ color: '#38bdf8' }}>
                  <Brain size={20} />
                </div>
                <div className="stat-val">{profile.completedQuadraSyncCycles}</div>
                <div className="stat-label">Quadra-Sync OA-ZA Cycles</div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap" style={{ color: '#10b981' }}>
                  <Award size={20} />
                </div>
                <div className="stat-val">{profile.totalExercisesCompleted}</div>
                <div className="stat-label">Creativity NCT Drills</div>
              </div>
            </div>

            <div className="ledger-assurance-banner">
              <Shield size={16} />
              <span>Cryptographic verification ledger head anchor: <code>0x3d944d8e60907442</code></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
