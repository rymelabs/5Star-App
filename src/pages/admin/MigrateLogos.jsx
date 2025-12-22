import React, { useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirebaseDb, getFirebaseStorage } from '../../firebase/config';
import { generateLogoVariants, urlToFile } from '../../utils/imageResize';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Play, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Admin tool to migrate existing team logos to thumbnail variants
 * This runs in the browser and processes teams one by one
 * SUPER ADMIN ONLY - This is a sensitive operation
 */
const MigrateLogos = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle'); // idle, running, complete
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  // Only super admins can run this migration
  const isSuperAdmin = user?.isSuperAdmin === true;

  const runMigration = async () => {
    if (!isSuperAdmin) {
      setError('You must be a Super Admin to run this migration');
      return;
    }

    setStatus('running');
    setResults([]);
    setError(null);

    try {
      const db = getFirebaseDb();
      const storage = getFirebaseStorage();
      
      // Fetch all teams
      const teamsSnapshot = await getDocs(collection(db, 'teams'));
      const teams = teamsSnapshot.docs;
      
      setProgress({ current: 0, total: teams.length });
      
      const migrationResults = [];
      
      for (let i = 0; i < teams.length; i++) {
        const teamDoc = teams[i];
        const teamData = teamDoc.data();
        const teamName = teamData.name || 'Unknown';
        
        setProgress({ current: i + 1, total: teams.length });
        
        // Skip if no logo or already has thumbnail
        if (!teamData.logo) {
          migrationResults.push({ 
            teamName, 
            status: 'skipped', 
            reason: 'No logo' 
          });
          continue;
        }
        
        if (teamData.logoThumbUrl) {
          migrationResults.push({ 
            teamName, 
            status: 'skipped', 
            reason: 'Already has thumbnail' 
          });
          continue;
        }
        
        try {
          // Download and convert to File using canvas approach
          const file = await urlToFile(teamData.logo, teamName);
          
          // Generate thumbnail only (we already have full logo)
          const { thumbnail } = await generateLogoVariants(file);
          
          // Upload thumbnail
          const safeName = teamName.replace(/[^a-zA-Z0-9]/g, '_');
          const thumbnailRef = ref(storage, `teams/${safeName}_${Date.now()}_thumb.webp`);
          
          await uploadBytes(thumbnailRef, thumbnail, {
            contentType: 'image/webp',
            customMetadata: {
              variant: 'thumbnail',
              migratedAt: new Date().toISOString()
            }
          });
          
          const thumbnailUrl = await getDownloadURL(thumbnailRef);
          
          // Update Firestore
          await updateDoc(doc(db, 'teams', teamDoc.id), {
            logoThumbUrl: thumbnailUrl,
            updatedAt: new Date().toISOString()
          });
          
          migrationResults.push({ 
            teamName, 
            status: 'success',
            thumbnailUrl 
          });
          
        } catch (err) {
          console.error(`Failed to migrate ${teamName}:`, err);
          // Check if it's a CORS error
          const isCorsError = err.message.includes('CORS') || err.message.includes('Failed to load');
          migrationResults.push({ 
            teamName, 
            status: 'error', 
            reason: isCorsError 
              ? 'External URL blocked by CORS - re-upload logo manually' 
              : err.message 
          });
        }
        
        // Update results in real-time
        setResults([...migrationResults]);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      setStatus('complete');
      
    } catch (err) {
      console.error('Migration failed:', err);
      setError(err.message);
      setStatus('idle');
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const skippedCount = results.filter(r => r.status === 'skipped').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">Only Super Admins can access this tool.</p>
          <button
            onClick={() => navigate('/admin')}
            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Logo Migration Tool</h1>
            <p className="text-gray-400 text-sm">Generate thumbnails for existing team logos</p>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
          <h2 className="font-semibold text-white mb-2">What this does:</h2>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Fetches all teams from the database</li>
            <li>• Downloads each team's existing logo</li>
            <li>• Generates a 64x64 WebP thumbnail (~3KB each)</li>
            <li>• Uploads thumbnail to Firebase Storage</li>
            <li>• Updates team document with logoThumbUrl</li>
          </ul>
        </div>

        {/* CORS Warning */}
        <div className="bg-yellow-500/10 rounded-xl p-4 mb-6 border border-yellow-500/30">
          <h2 className="font-semibold text-yellow-400 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Important: External URLs
          </h2>
          <p className="text-sm text-yellow-200/80 mb-2">
            Logos from external websites (like logos-world.net) will fail due to browser security (CORS).
          </p>
          <p className="text-sm text-yellow-200/80">
            <strong>Solution:</strong> For teams with external logo URLs, edit the team and re-upload the logo using the file upload option. The new upload will automatically create both thumbnail and full-size variants.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-red-400">
              <XCircle className="w-5 h-5" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-300 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Action Button */}
        {status === 'idle' && (
          <button
            onClick={runMigration}
            className="w-full py-3 px-4 bg-brand-purple hover:bg-brand-purple/80 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Play className="w-5 h-5" />
            Start Migration
          </button>
        )}

        {/* Progress */}
        {status === 'running' && (
          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="w-5 h-5 text-brand-purple animate-spin" />
              <span className="text-white font-medium">
                Processing {progress.current} of {progress.total} teams...
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className="bg-brand-purple h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Results Summary */}
        {results.length > 0 && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{successCount}</div>
                <div className="text-xs text-green-300">Success</div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-yellow-400">{skippedCount}</div>
                <div className="text-xs text-yellow-300">Skipped</div>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-red-400">{errorCount}</div>
                <div className="text-xs text-red-300">Errors</div>
              </div>
            </div>

            {/* Results List */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                {results.map((result, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 border-b border-white/5 last:border-0"
                  >
                    <span className="text-white text-sm truncate flex-1">{result.teamName}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {result.status === 'success' && (
                        <span className="flex items-center gap-1 text-green-400 text-xs">
                          <CheckCircle className="w-4 h-4" />
                          Done
                        </span>
                      )}
                      {result.status === 'skipped' && (
                        <span className="text-yellow-400 text-xs">{result.reason}</span>
                      )}
                      {result.status === 'error' && (
                        <span className="text-red-400 text-xs">{result.reason}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Completion Message */}
        {status === 'complete' && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mt-6">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Migration Complete!</span>
            </div>
            <p className="text-green-300 text-sm mt-1">
              All teams have been processed. Thumbnails will now be used in fixture cards and team lists.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MigrateLogos;
