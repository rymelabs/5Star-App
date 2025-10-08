import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { submissionsCollection } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import countries from '../data/countries';

const SubmitTeam = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    logo: '',
    stadium: '',
    founded: '',
    manager: '',
    players: []
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playerForm, setPlayerForm] = useState({
    name: '',
    position: 'Forward',
    jerseyNumber: '',
    isCaptain: false,
    isGoalkeeper: false,
    dateOfBirth: '',
  placeOfBirth: '',
  nationality: '',
    height: '',
    preferredFoot: 'right',
  // marketValue and contractExpiry removed per requirements
  });

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const { t } = useLanguage();

  const handlePlayerChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPlayerForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const addPlayer = () => {
    if (!playerForm.name.trim() || !playerForm.jerseyNumber) {
      setError('Player name and jersey number are required');
      return;
    }

    const jersey = parseInt(playerForm.jerseyNumber);
    if (!jersey || jersey < 1 || jersey > 99) {
      setError('Jersey number must be a number between 1 and 99');
      return;
    }

    // Check duplicate jersey numbers
    if (form.players.some(p => p.jerseyNumber === jersey)) {
      setError(`Jersey number ${jersey} is already used`);
      return;
    }

    const newPlayer = {
      id: Date.now().toString(),
      name: playerForm.name.trim(),
      position: playerForm.position || 'Forward',
      jerseyNumber: jersey,
      isCaptain: !!playerForm.isCaptain,
      isGoalkeeper: !!playerForm.isGoalkeeper
  ,dateOfBirth: playerForm.dateOfBirth || '',
  placeOfBirth: playerForm.placeOfBirth || '',
  nationality: playerForm.nationality || '',
  height: playerForm.height || '',
  preferredFoot: playerForm.preferredFoot || 'right'
    };

    // If marking goalkeeper or captain, unset previous
    let players = form.players.slice();
    if (newPlayer.isGoalkeeper) {
      players = players.map(p => ({ ...p, isGoalkeeper: false }));
    }
    if (newPlayer.isCaptain) {
      players = players.map(p => ({ ...p, isCaptain: false }));
    }

    players.push(newPlayer);

    setForm(prev => ({ ...prev, players }));
    setPlayerForm({ name: '', position: 'Forward', jerseyNumber: '', isCaptain: false, isGoalkeeper: false });
    setError(null);
  };

  const removePlayer = (id) => {
    setForm(prev => ({ ...prev, players: prev.players.filter(p => p.id !== id) }));
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Normalize players array to match admin shape
      const normalizedPlayers = (form.players || []).map(p => ({
        id: p.id || `${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`,
        name: (p.name || '').trim(),
        position: p.position || 'Forward',
        jerseyNumber: typeof p.jerseyNumber === 'number' ? p.jerseyNumber : parseInt(p.jerseyNumber) || 0,
        isCaptain: !!p.isCaptain,
        isGoalkeeper: !!p.isGoalkeeper
  ,dateOfBirth: p.dateOfBirth || '',
  placeOfBirth: p.placeOfBirth || '',
  nationality: p.nationality || '',
  height: p.height || '',
  preferredFoot: p.preferredFoot || 'right'
      }));

      const payload = {
        name: form.name.trim(),
        logo: form.logo.trim() || '',
        stadium: form.stadium.trim() || '',
        founded: form.founded.trim() || '',
        manager: form.manager.trim() || '',
        players: normalizedPlayers,
        // contact info is derived from the authenticated user on the server side
        userId: user?.uid || null,
        status: 'pending'
      };

      // Use the authenticated user's UID as the doc id to enforce one submission per user
      const uid = user?.uid || '';
      if (!uid) {
        setError('You must be signed in to submit.');
        setLoading(false);
        return;
      }

      const docId = uid;

      // Compute emailKey from authenticated email if available (sanitized)
      const authEmail = (user && user.email) ? user.email.trim().toLowerCase() : '';
      const emailKey = authEmail ? authEmail.replaceAll('@', '-').replaceAll('.', '-') : null;

      // Debug log payload (helps diagnose rule rejections)
      console.debug('Submitting payload:', payload, 'docId:', docId, 'emailKey:', emailKey);

      try {
        if (emailKey) {
          // use atomic add that creates an email->uid index to prevent duplicate email submissions
          await submissionsCollection.addWithEmailIndex(payload, docId, emailKey);
        } else {
          // fallback to uid-only submission
          await submissionsCollection.add(payload, docId);
        }
      } catch (err) {
        // If server denies write due to rules (e.g., doc exists or user mismatch), surface a friendly message
        if (err && err.code === 'permission-denied') {
          setError('A submission already exists for this email or you do not have permission. If you need to update it, contact support.');
          setLoading(false);
          return;
        }
        throw err;
      }
      navigate('/');
    } catch (err) {
      console.error('SubmitTeam error:', err);
      setError('Failed to submit team. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (e) => {
    e.preventDefault();
    setError(null);
    // basic validation
    if (!form.name.trim()) {
      setError('Team name is required for preview');
      return;
    }
    // run a soft duplicate check against pending submissions
    (async () => {
      try {
        const pending = await submissionsCollection.getPending();
        const nameLower = form.name.trim().toLowerCase();
        // check for team name match
        const nameMatch = pending.find(p => (p.name || '').trim().toLowerCase() === nameLower);

        // check core players overlap (by name or jersey)
        const playerNames = (form.players || []).map(x => (x.name || '').trim().toLowerCase()).filter(Boolean);
        const playerJerseys = (form.players || []).map(x => String(x.jerseyNumber));

        let playerOverlap = null;
        if (playerNames.length > 0) {
          for (const p of pending) {
            const pendingNames = (p.players || []).map(x => (x.name || '').trim().toLowerCase());
            const pendingJerseys = (p.players || []).map(x => String(x.jerseyNumber));
            const nameIntersection = playerNames.filter(n => pendingNames.includes(n));
            const jerseyIntersection = playerJerseys.filter(j => pendingJerseys.includes(j));
            if (nameIntersection.length > 0 || jerseyIntersection.length > 0) {
              playerOverlap = { submission: p, nameIntersection, jerseyIntersection };
              break;
            }
          }
        }

        if (nameMatch || playerOverlap) {
          setDuplicateWarning({ nameMatch, playerOverlap });
        } else {
          setDuplicateWarning(null);
        }
      } catch (err) {
        console.warn('Duplicate check failed', err);
        setDuplicateWarning(null);
      }

      setPreviewOpen(true);
    })();
  };

  const handleConfirm = async () => {
    // Called from preview to perform final submit
    setPreviewOpen(false);
    await handleSubmit();
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="p-2 rounded-md hover:bg-dark-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-300" />
        </button>
        <h1 className="text-[35px] text-primary-500 font-semibold m-0">Submit a Team</h1>
      </div>
      <p className="text-sm text-gray-400 mb-4">Fill in the details below and submit. An admin will review and approve your submission.</p>

      {!authLoading && !user ? (
        <div className="p-6 bg-dark-800 rounded-lg">
          <p className="text-sm text-gray-300 mb-4">You must be signed in to submit a team.</p>
          <div className="flex gap-2">
            <a href="/auth/login" className="px-4 py-2 bg-primary-600 text-white rounded">Sign in</a>
            <button type="button" onClick={signInWithGoogle} className="px-4 py-2 bg-blue-600 text-white rounded">Sign in with Google</button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* If user is signed in, show their email as read-only */}
          {user && (
            <div>
              <label className="block text-sm text-gray-300 mb-1">Signed in as</label>
              <input value={user.email} readOnly className="input-field w-full bg-dark-800" />
            </div>
          )}
        <div>
          <label className="block text-sm text-gray-300 mb-1">Team Name *</label>
          <input name="name" value={form.name} onChange={handleChange} required className="input-field w-full" />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Logo URL</label>
          <input name="logo" value={form.logo} onChange={handleChange} className="input-field w-full" />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Stadium</label>
          <input name="stadium" value={form.stadium} onChange={handleChange} className="input-field w-full" />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Founded</label>
          <input name="founded" value={form.founded} onChange={handleChange} className="input-field w-full" />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Manager</label>
          <input name="manager" value={form.manager} onChange={handleChange} className="input-field w-full mb-4" />
        </div>

        {/* Contact info removed: derived from authenticated user */}

        <div>
          <label className="block text-sm text-primary-500 mb-1">Players</label>
          <div className="mb-2 text-sm text-gray-400">Add players individually. Jersey numbers must be unique (1-99).</div>

          {/* Player form */}
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 mb-2">
            <input name="name" value={playerForm.name} onChange={handlePlayerChange} placeholder="Name" className="input-field col-span-2" />
            <select name="position" value={playerForm.position} onChange={handlePlayerChange} className="input-field col-span-1">
              <option>Forward</option>
              <option>Midfielder</option>
              <option>Defender</option>
              <option>Goalkeeper</option>
            </select>
            <input name="jerseyNumber" value={playerForm.jerseyNumber} onChange={handlePlayerChange} placeholder="#" className="input-field col-span-1" />
            <label className="flex items-center gap-2 col-span-1">
              <input type="checkbox" name="isCaptain" checked={playerForm.isCaptain} onChange={handlePlayerChange} />
              <span className="text-sm text-gray-300">Captain</span>
            </label>
            <label className="flex items-center gap-2 col-span-1">
              <input type="checkbox" name="isGoalkeeper" checked={playerForm.isGoalkeeper} onChange={handlePlayerChange} />
              <span className="text-sm text-gray-300">Goalkeeper</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 mb-2">
            <input name="dateOfBirth" type="date" value={playerForm.dateOfBirth} onChange={handlePlayerChange} placeholder="DOB" className="input-field col-span-2" />
            <select name="placeOfBirth" value={playerForm.placeOfBirth} onChange={handlePlayerChange} className="input-field col-span-2">
              <option value="">Place of Birth</option>
              {countries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select name="nationality" value={playerForm.nationality} onChange={handlePlayerChange} className="input-field col-span-2">
              <option value="">Nationality</option>
              {countries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 mb-2">
            <input name="height" value={playerForm.height} onChange={handlePlayerChange} placeholder="Height (cm)" className="input-field col-span-1" />
            <select name="preferredFoot" value={playerForm.preferredFoot} onChange={handlePlayerChange} className="input-field col-span-1">
              <option value="right">Right</option>
              <option value="left">Left</option>
              <option value="both">Both</option>
            </select>
            {/* marketValue and contractExpiry removed per requirements */}
            <div className="col-span-4"></div>
          </div>
          <div className="flex gap-2 mb-4">
            <button type="button" onClick={addPlayer} className="px-3 py-1 bg-primary-600 text-white rounded">Add Player</button>
            <button type="button" onClick={() => setPlayerForm({ name: '', position: 'Forward', jerseyNumber: '', isCaptain: false, isGoalkeeper: false })} className="px-3 py-1 bg-gray-600 text-white rounded">Reset</button>
          </div>

          {/* Players list */}
          {form.players.length > 0 ? (
            <ul className="space-y-2 mb-4">
              {form.players.map(p => (
                    <li key={p.id} className="flex items-center justify-between bg-dark-900 p-2 rounded">
                      <div>
                        <div className="text-sm font-medium text-white">#{p.jerseyNumber} - {p.name}</div>
                        <div className="text-xs text-gray-400">{p.position} {p.isCaptain ? '• Captain' : ''} {p.isGoalkeeper ? '• GK' : ''}</div>
                        <div className="text-xs text-gray-500 mt-1">{p.nationality || '—'} • DOB: {p.dateOfBirth || '—'} • {p.height ? `${p.height}cm` : '—'}</div>
                      </div>
                      <div>
                        <button type="button" onClick={() => removePlayer(p.id)} className="text-red-400 hover:text-red-300">Remove</button>
                      </div>
                    </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-400 mb-8">No players added yet.</div>
          )}
        </div>

        {error && <div className="text-red-400">{error}</div>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={handlePreview} disabled={loading} className="px-4 py-2 bg-gray-600 text-white rounded-lg">
            Preview
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-lg">
            {loading ? 'Submitting...' : 'Submit Team'}
          </button>
        </div>

        {/* Preview Modal/Panel */}
        {previewOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-dark-900 p-6 rounded-lg max-w-2xl w-full">
              <h2 className="text-lg font-semibold mb-2">Preview Submission</h2>
              <div className="mb-4">
                <div className="text-sm text-gray-400">Team Name</div>
                <div className="text-white font-medium">{form.name}</div>
              </div>
              <div className="mb-4">
                <div className="text-sm text-gray-400">Manager</div>
                <div className="text-white">{form.manager || '—'}</div>
              </div>
              <div className="mb-4">
                <div className="text-sm text-gray-400">Players</div>
                {form.players.length > 0 ? (
                  <ul className="mt-2 space-y-2 max-h-48 overflow-auto">
                    {form.players.map(p => (
                      <li key={p.id} className="flex items-center justify-between bg-dark-800 p-2 rounded">
                        <div>
                          <div className="text-sm text-white">#{p.jerseyNumber} {p.name}</div>
                          <div className="text-xs text-gray-400">{p.position} {p.isCaptain ? '• Captain' : ''} {p.isGoalkeeper ? '• GK' : ''}</div>
                          <div className="text-xs text-gray-500 mt-1">{p.nationality || '—'} • DOB: {p.dateOfBirth || '—'}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-gray-400">No players added.</div>
                )}
              </div>

              {duplicateWarning && (
                <div className="mb-4 p-3 bg-yellow-900 rounded text-yellow-100">
                  <div className="font-semibold">Possible duplicate submission detected</div>
                  {duplicateWarning.nameMatch && (
                    <div className="text-sm mt-1">A pending submission already uses the team name <strong className="text-white">{duplicateWarning.nameMatch.name}</strong>.</div>
                  )}
                  {duplicateWarning.playerOverlap && (
                    <div className="text-sm mt-1">Core player overlap with submission <strong className="text-white">{duplicateWarning.playerOverlap.submission.name}</strong>:</div>
                  )}
                  {duplicateWarning.playerOverlap && duplicateWarning.playerOverlap.nameIntersection && duplicateWarning.playerOverlap.nameIntersection.length > 0 && (
                    <div className="text-xs mt-1">Matching player names: {duplicateWarning.playerOverlap.nameIntersection.join(', ')}</div>
                  )}
                  {duplicateWarning.playerOverlap && duplicateWarning.playerOverlap.jerseyIntersection && duplicateWarning.playerOverlap.jerseyIntersection.length > 0 && (
                    <div className="text-xs mt-1">Matching jersey numbers: {duplicateWarning.playerOverlap.jerseyIntersection.join(', ')}</div>
                  )}
                  <div className="mt-2 text-sm">You can continue to submit, and admins will review possible duplicates.</div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setPreviewOpen(false)} className="px-3 py-1 bg-gray-600 text-white rounded">Cancel</button>
                <button type="button" onClick={handleConfirm} className="px-3 py-1 bg-primary-600 text-white rounded">Confirm & Submit</button>
              </div>
            </div>
          </div>
        )}
      </form>
      )}
    </div>
  );
};

export default SubmitTeam;
