import React, { useState } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { useFootball } from '../context/FootballContext';
import { useNotification } from '../context/NotificationContext';

const BulkTeamUpload = ({ isOpen, onClose }) => {
  const [uploadMethod, setUploadMethod] = useState('csv');
  const [csvData, setCsvData] = useState('');
  const [jsonData, setJsonData] = useState('');
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { addBulkTeams } = useFootball();
  const { showNotification } = useNotification();

  if (!isOpen) return null;

  const csvTemplate = `name,logo,stadium,founded,manager
Arsenal,https://logos-world.net/wp-content/uploads/2020/06/Arsenal-Logo.png,Emirates Stadium,1886,Mikel Arteta
Chelsea,https://logos-world.net/wp-content/uploads/2020/06/Chelsea-Logo.png,Stamford Bridge,1905,Mauricio Pochettino
Manchester United,https://logos-world.net/wp-content/uploads/2020/06/Manchester-United-Logo.png,Old Trafford,1878,Erik ten Hag`;

  const jsonTemplate = JSON.stringify([
    {
      name: "Arsenal",
      logo: "https://logos-world.net/wp-content/uploads/2020/06/Arsenal-Logo.png",
      stadium: "Emirates Stadium",
      founded: "1886",
      manager: "Mikel Arteta"
    },
    {
      name: "Chelsea", 
      logo: "https://logos-world.net/wp-content/uploads/2020/06/Chelsea-Logo.png",
      stadium: "Stamford Bridge",
      founded: "1905",
      manager: "Mauricio Pochettino"
    }
  ], null, 2);

  const downloadTemplate = (type) => {
    const content = type === 'csv' ? csvTemplate : jsonTemplate;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teams-template.${type}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const validateTeamData = (teams) => {
    const errors = [];
    const validTeams = [];

    teams.forEach((team, index) => {
      const rowErrors = [];
      
      if (!team.name || team.name.trim() === '') {
        rowErrors.push('Team name is required');
      }
      
      if (team.founded && (isNaN(team.founded) || team.founded < 1800 || team.founded > new Date().getFullYear())) {
        rowErrors.push('Founded year must be between 1800 and current year');
      }
      
      if (team.logo && !team.logo.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i)) {
        rowErrors.push('Logo must be a valid image URL');
      }

      if (rowErrors.length > 0) {
        errors.push({
          row: index + 1,
          team: team.name || 'Unknown',
          errors: rowErrors
        });
      } else {
        validTeams.push({
          id: Date.now() + Math.random(),
          name: team.name.trim(),
          logo: team.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(team.name)}&background=f97316&color=fff`,
          stadium: team.stadium || '',
          founded: team.founded || '',
          manager: team.manager || ''
        });
      }
    });

    return { errors, validTeams };
  };

  const parseCsvData = (csv) => {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const teams = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const team = {};
      
      headers.forEach((header, index) => {
        team[header] = values[index] || '';
      });
      
      teams.push(team);
    }
    
    return teams;
  };

  const parseJsonData = (json) => {
    try {
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  };

  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target.result;
      if (selectedFile.name.endsWith('.csv')) {
        setCsvData(content);
        setUploadMethod('csv');
      } else if (selectedFile.name.endsWith('.json')) {
        setJsonData(content);
        setUploadMethod('json');
      }
    };
    
    reader.readAsText(selectedFile);
  };

  const previewDataHandler = () => {
    setErrors([]);
    setPreviewData([]);
    
    let teams = [];
    
    if (uploadMethod === 'csv') {
      teams = parseCsvData(csvData);
    } else {
      teams = parseJsonData(jsonData);
      if (!teams) {
        setErrors([{ row: 1, team: 'JSON', errors: ['Invalid JSON format'] }]);
        return;
      }
    }
    
    if (teams.length === 0) {
      setErrors([{ row: 1, team: 'Data', errors: ['No valid team data found'] }]);
      return;
    }
    
    const { errors: validationErrors, validTeams } = validateTeamData(teams);
    setErrors(validationErrors);
    setPreviewData(validTeams);
  };

  const handleUpload = async () => {
    if (previewData.length === 0) {
      showNotification('No teams to upload', 'error');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      await addBulkTeams(previewData);
      showNotification(`Successfully uploaded ${previewData.length} teams!`, 'success');
      onClose();
    } catch (error) {
      showNotification('Failed to upload teams', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-dark-900 border border-dark-700 rounded-2xl shadow-xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <h2 className="text-xl font-bold text-white tracking-tight">Bulk Upload Teams</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Upload Method Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Upload Method</label>
            <div className="flex space-x-4">
              <button
                onClick={() => setUploadMethod('csv')}
                className={`px-4 py-2 rounded-lg font-medium tracking-tight transition-colors ${
                  uploadMethod === 'csv' 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                }`}
              >
                CSV Format
              </button>
              <button
                onClick={() => setUploadMethod('json')}
                className={`px-4 py-2 rounded-lg font-medium tracking-tight transition-colors ${
                  uploadMethod === 'json' 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                }`}
              >
                JSON Format
              </button>
            </div>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Upload File</label>
            <input
              type="file"
              accept={uploadMethod === 'csv' ? '.csv' : '.json'}
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-500 file:text-white file:font-medium hover:file:bg-primary-600"
            />
          </div>

          {/* Template Download */}
          <div className="mb-6">
            <button
              onClick={() => downloadTemplate(uploadMethod)}
              className="flex items-center text-primary-400 hover:text-primary-300 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download {uploadMethod.toUpperCase()} Template
            </button>
          </div>

          {/* Manual Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Or paste {uploadMethod.toUpperCase()} data manually:
            </label>
            <textarea
              value={uploadMethod === 'csv' ? csvData : jsonData}
              onChange={(e) => uploadMethod === 'csv' ? setCsvData(e.target.value) : setJsonData(e.target.value)}
              placeholder={`Paste your ${uploadMethod.toUpperCase()} data here...`}
              className="w-full h-32 bg-dark-800 border border-dark-700 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
            />
          </div>

          {/* Preview Button */}
          <div className="mb-6">
            <button
              onClick={previewDataHandler}
              className="btn-primary flex items-center"
              disabled={(!csvData && !jsonData) || isProcessing}
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Preview & Validate Data
            </button>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <h3 className="text-red-400 font-semibold mb-2">Validation Errors:</h3>
              <ul className="space-y-1 text-sm text-red-300">
                {errors.map((error, index) => (
                  <li key={index}>
                    Row {error.row} ({error.team}): {error.errors.join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview Data */}
          {previewData.length > 0 && (
            <div className="mb-6">
              <h3 className="text-accent-400 font-semibold mb-3 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Preview ({previewData.length} teams ready to upload)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto">
                {previewData.slice(0, 10).map((team, index) => (
                  <div key={index} className="bg-dark-800 border border-dark-700 rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      <img src={team.logo} alt={team.name} className="w-8 h-8 mr-3 rounded" />
                      <h4 className="font-semibold text-white">{team.name}</h4>
                    </div>
                    <p className="text-sm text-gray-400">Stadium: {team.stadium || 'Not specified'}</p>
                    <p className="text-sm text-gray-400">Founded: {team.founded || 'Not specified'}</p>
                    <p className="text-sm text-gray-400">Manager: {team.manager || 'Not specified'}</p>
                  </div>
                ))}
                {previewData.length > 10 && (
                  <div className="col-span-full text-center text-gray-400 text-sm">
                    And {previewData.length - 10} more teams...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upload Button */}
          {previewData.length > 0 && errors.length === 0 && (
            <button
              onClick={handleUpload}
              disabled={isProcessing}
              className="btn-primary flex items-center w-full justify-center"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isProcessing ? 'Uploading...' : `Upload ${previewData.length} Teams`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkTeamUpload;