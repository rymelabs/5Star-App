import React, { useState } from 'react';
import { Upload, Download, FileText, X, Check, AlertCircle } from 'lucide-react';

const BulkTeamUpload = ({ onUpload, onClose }) => {
  const [uploadMethod, setUploadMethod] = useState('csv'); // 'csv' or 'json'
  const [csvData, setCsvData] = useState('');
  const [jsonData, setJsonData] = useState('');
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState([]);
  const [preview, setPreview] = useState([]);

  // CSV template and sample data
  const csvTemplate = `name,logo,stadium,founded,manager
Arsenal,https://logos-world.net/wp-content/uploads/2020/06/Arsenal-Logo.png,Emirates Stadium,1886,Mikel Arteta
Chelsea,https://logos-world.net/wp-content/uploads/2020/06/Chelsea-Logo.png,Stamford Bridge,1905,Mauricio Pochettino
Liverpool,https://logos-world.net/wp-content/uploads/2020/06/Liverpool-Logo.png,Anfield,1892,Jurgen Klopp`;

  const jsonTemplate = `[
  {
    "name": "Arsenal",
    "logo": "https://logos-world.net/wp-content/uploads/2020/06/Arsenal-Logo.png",
    "stadium": "Emirates Stadium",
    "founded": "1886",
    "manager": "Mikel Arteta"
  },
  {
    "name": "Chelsea",
    "logo": "https://logos-world.net/wp-content/uploads/2020/06/Chelsea-Logo.png",
    "stadium": "Stamford Bridge",
    "founded": "1905",
    "manager": "Mauricio Pochettino"
  }
]`;

  const downloadTemplate = (type) => {
    const content = type === 'csv' ? csvTemplate : jsonTemplate;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teams-template.${type}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const parseCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
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

  const validateTeam = (team, index) => {
    const errors = [];
    
    if (!team.name || team.name.trim() === '') {
      errors.push(`Row ${index + 1}: Team name is required`);
    }
    
    if (team.founded && (isNaN(team.founded) || team.founded < 1800 || team.founded > new Date().getFullYear())) {
      errors.push(`Row ${index + 1}: Founded year must be a valid year between 1800 and ${new Date().getFullYear()}`);
    }

    if (team.logo && !team.logo.startsWith('http')) {
      errors.push(`Row ${index + 1}: Logo must be a valid URL starting with http or https`);
    }
    
    return errors;
  };

  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target.result;
      if (uploadMethod === 'csv') {
        setCsvData(content);
      } else {
        setJsonData(content);
      }
    };
    
    reader.readAsText(selectedFile);
  };

  const handlePreview = () => {
    setErrors([]);
    setPreview([]);
    
    try {
      let teams = [];
      
      if (uploadMethod === 'csv') {
        const data = csvData || (file ? '' : csvTemplate);
        teams = parseCSV(data);
      } else {
        const data = jsonData || (file ? '' : jsonTemplate);
        teams = JSON.parse(data);
      }
      
      // Validate all teams
      const allErrors = [];
      teams.forEach((team, index) => {
        const teamErrors = validateTeam(team, index);
        allErrors.push(...teamErrors);
      });
      
      if (allErrors.length > 0) {
        setErrors(allErrors);
        return;
      }
      
      setPreview(teams);
    } catch (error) {
      setErrors([`Invalid ${uploadMethod.toUpperCase()} format: ${error.message}`]);
    }
  };

  const handleUpload = async () => {
    if (preview.length === 0) {
      setErrors(['Please preview the data first']);
      return;
    }
    
    setProcessing(true);
    
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call the upload function with the teams data
      await onUpload(preview);
      onClose();
    } catch (error) {
      setErrors([`Upload failed: ${error.message}`]);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <div>
            <h2 className="text-lg font-semibold text-white">Bulk Upload Teams</h2>
            <p className="text-gray-400 text-sm">Upload multiple teams using CSV or JSON format</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-dark-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {/* Upload Method Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">Upload Method</label>
            <div className="flex space-x-4">
              <button
                onClick={() => setUploadMethod('csv')}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  uploadMethod === 'csv'
                    ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                    : 'border-dark-600 text-gray-400 hover:border-dark-500'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                CSV Format
              </button>
              <button
                onClick={() => setUploadMethod('json')}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  uploadMethod === 'json'
                    ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                    : 'border-dark-600 text-gray-400 hover:border-dark-500'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                JSON Format
              </button>
            </div>
          </div>

          {/* Template Download */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">Template</label>
              <button
                onClick={() => downloadTemplate(uploadMethod)}
                className="text-primary-500 text-sm hover:text-primary-400 transition-colors flex items-center"
              >
                <Download className="w-4 h-4 mr-1" />
                Download Template
              </button>
            </div>
            <div className="bg-dark-900 rounded-lg p-3 text-xs text-gray-400 font-mono overflow-x-auto">
              <pre>{uploadMethod === 'csv' ? csvTemplate : jsonTemplate}</pre>
            </div>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Upload File (Optional)
            </label>
            <div className="border-2 border-dashed border-dark-600 rounded-lg p-6 text-center hover:border-dark-500 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-400 mb-2">
                Click to upload or drag and drop your {uploadMethod.toUpperCase()} file
              </p>
              <input
                type="file"
                accept={uploadMethod === 'csv' ? '.csv' : '.json'}
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer transition-colors"
              >
                Choose File
              </label>
              {file && (
                <p className="mt-2 text-sm text-accent-400">
                  Selected: {file.name}
                </p>
              )}
            </div>
          </div>

          {/* Manual Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Or Paste {uploadMethod.toUpperCase()} Data Manually
            </label>
            <textarea
              value={uploadMethod === 'csv' ? csvData : jsonData}
              onChange={(e) => 
                uploadMethod === 'csv' 
                  ? setCsvData(e.target.value)
                  : setJsonData(e.target.value)
              }
              className="input-field w-full h-40 font-mono text-sm resize-none"
              placeholder={`Paste your ${uploadMethod.toUpperCase()} data here...`}
            />
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-6 bg-red-900/20 border border-red-700 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                <h4 className="font-medium text-red-400">Validation Errors</h4>
              </div>
              <ul className="text-sm text-red-300 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-white mb-3 flex items-center">
                <Check className="w-5 h-5 text-accent-400 mr-2" />
                Preview ({preview.length} teams)
              </h4>
              <div className="bg-dark-900 rounded-lg p-4 max-h-60 overflow-y-auto">
                <div className="space-y-3">
                  {preview.map((team, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 bg-dark-700 rounded-lg">
                      <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-white">{team.name}</h5>
                        <div className="text-xs text-gray-400 space-y-1">
                          {team.stadium && <p>🏟️ {team.stadium}</p>}
                          {team.founded && <p>📅 Founded {team.founded}</p>}
                          {team.manager && <p>👨‍💼 {team.manager}</p>}
                        </div>
                      </div>
                      {team.logo && (
                        <img
                          src={team.logo}
                          alt={team.name}
                          className="w-8 h-8 object-contain rounded"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePreview}
              disabled={(!csvData && !jsonData && !file)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Preview Data
            </button>
            <button
              onClick={handleUpload}
              disabled={preview.length === 0 || processing}
              className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {processing ? 'Uploading...' : `Upload ${preview.length} Teams`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkTeamUpload;