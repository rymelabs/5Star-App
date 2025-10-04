import React, { useState } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { useFootball } from '../context/FootballContext';
import { useNotification } from '../context/NotificationContext';
import * as XLSX from 'xlsx';

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

  const csvTemplate = `name,logo,stadium,founded,manager,players
Arsenal,https://logos-world.net/wp-content/uploads/2020/06/Arsenal-Logo.png,Emirates Stadium,1886,Mikel Arteta,"[{""name"":""Bukayo Saka"",""position"":""Forward"",""jerseyNumber"":""7"",""isCaptain"":false,""isGoalkeeper"":false},{""name"":""Martin Odegaard"",""position"":""Midfielder"",""jerseyNumber"":""8"",""isCaptain"":true,""isGoalkeeper"":false},{""name"":""Aaron Ramsdale"",""position"":""Goalkeeper"",""jerseyNumber"":""1"",""isCaptain"":false,""isGoalkeeper"":true}]"
Chelsea,https://logos-world.net/wp-content/uploads/2020/06/Chelsea-Logo.png,Stamford Bridge,1905,Mauricio Pochettino,"[{""name"":""Cole Palmer"",""position"":""Forward"",""jerseyNumber"":""20"",""isCaptain"":false,""isGoalkeeper"":false},{""name"":""Reece James"",""position"":""Defender"",""jerseyNumber"":""24"",""isCaptain"":true,""isGoalkeeper"":false},{""name"":""Robert Sanchez"",""position"":""Goalkeeper"",""jerseyNumber"":""1"",""isCaptain"":false,""isGoalkeeper"":true}]"
Manchester United,https://logos-world.net/wp-content/uploads/2020/06/Manchester-United-Logo.png,Old Trafford,1878,Erik ten Hag,"[{""name"":""Marcus Rashford"",""position"":""Forward"",""jerseyNumber"":""10"",""isCaptain"":false,""isGoalkeeper"":false},{""name"":""Bruno Fernandes"",""position"":""Midfielder"",""jerseyNumber"":""8"",""isCaptain"":true,""isGoalkeeper"":false},{""name"":""Andre Onana"",""position"":""Goalkeeper"",""jerseyNumber"":""24"",""isCaptain"":false,""isGoalkeeper"":true}]"`;

  const jsonTemplate = JSON.stringify([
    {
      name: "Arsenal",
      logo: "https://logos-world.net/wp-content/uploads/2020/06/Arsenal-Logo.png",
      stadium: "Emirates Stadium",
      founded: "1886",
      manager: "Mikel Arteta",
      players: [
        { name: "Bukayo Saka", position: "Forward", jerseyNumber: "7", isCaptain: false, isGoalkeeper: false },
        { name: "Martin Odegaard", position: "Midfielder", jerseyNumber: "8", isCaptain: true, isGoalkeeper: false },
        { name: "Aaron Ramsdale", position: "Goalkeeper", jerseyNumber: "1", isCaptain: false, isGoalkeeper: true },
        { name: "William Saliba", position: "Defender", jerseyNumber: "2", isCaptain: false, isGoalkeeper: false },
        { name: "Gabriel Jesus", position: "Forward", jerseyNumber: "9", isCaptain: false, isGoalkeeper: false }
      ]
    },
    {
      name: "Chelsea", 
      logo: "https://logos-world.net/wp-content/uploads/2020/06/Chelsea-Logo.png",
      stadium: "Stamford Bridge",
      founded: "1905",
      manager: "Mauricio Pochettino",
      players: [
        { name: "Cole Palmer", position: "Forward", jerseyNumber: "20", isCaptain: false, isGoalkeeper: false },
        { name: "Reece James", position: "Defender", jerseyNumber: "24", isCaptain: true, isGoalkeeper: false },
        { name: "Robert Sanchez", position: "Goalkeeper", jerseyNumber: "1", isCaptain: false, isGoalkeeper: true },
        { name: "Enzo Fernandez", position: "Midfielder", jerseyNumber: "5", isCaptain: false, isGoalkeeper: false },
        { name: "Nicolas Jackson", position: "Forward", jerseyNumber: "15", isCaptain: false, isGoalkeeper: false }
      ]
    }
  ], null, 2);

  const downloadTemplate = (type) => {
    if (type === 'xlsx') {
      // Create Excel workbook
      const exampleTeams = [
        {
          name: "Arsenal",
          logo: "https://logos-world.net/wp-content/uploads/2020/06/Arsenal-Logo.png",
          stadium: "Emirates Stadium",
          founded: "1886",
          manager: "Mikel Arteta",
          players: JSON.stringify([
            { name: "Bukayo Saka", position: "Forward", jerseyNumber: "7", isCaptain: false, isGoalkeeper: false },
            { name: "Martin Odegaard", position: "Midfielder", jerseyNumber: "8", isCaptain: true, isGoalkeeper: false },
            { name: "Aaron Ramsdale", position: "Goalkeeper", jerseyNumber: "1", isCaptain: false, isGoalkeeper: true }
          ])
        },
        {
          name: "Chelsea",
          logo: "https://logos-world.net/wp-content/uploads/2020/06/Chelsea-Logo.png",
          stadium: "Stamford Bridge",
          founded: "1905",
          manager: "Mauricio Pochettino",
          players: JSON.stringify([
            { name: "Cole Palmer", position: "Forward", jerseyNumber: "20", isCaptain: false, isGoalkeeper: false },
            { name: "Reece James", position: "Defender", jerseyNumber: "24", isCaptain: true, isGoalkeeper: false },
            { name: "Robert Sanchez", position: "Goalkeeper", jerseyNumber: "1", isCaptain: false, isGoalkeeper: true }
          ])
        }
      ];
      
      const worksheet = XLSX.utils.json_to_sheet(exampleTeams);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Teams");
      XLSX.writeFile(workbook, "teams-template.xlsx");
    } else {
      const content = type === 'csv' ? csvTemplate : jsonTemplate;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `teams-template.${type}`;
      a.click();
      URL.revokeObjectURL(url);
    }
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
      
      if (team.logo && !team.logo.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        rowErrors.push('Logo must be a valid image URL');
      }

      // Validate players if provided
      let validPlayers = [];
      if (team.players) {
        try {
          const playersList = typeof team.players === 'string' ? JSON.parse(team.players) : team.players;
          
          if (Array.isArray(playersList)) {
            const jerseyNumbers = new Set();
            let hasCaptain = false;
            let hasGoalkeeper = false;

            playersList.forEach((player, pIndex) => {
              if (!player.name || player.name.trim() === '') {
                rowErrors.push(`Player ${pIndex + 1}: Name is required`);
                return;
              }

              const jerseyNum = parseInt(player.jerseyNumber);
              if (!jerseyNum || jerseyNum < 1 || jerseyNum > 99) {
                rowErrors.push(`Player ${player.name}: Jersey number must be between 1-99`);
                return;
              }

              if (jerseyNumbers.has(jerseyNum)) {
                rowErrors.push(`Player ${player.name}: Jersey number ${jerseyNum} already used`);
                return;
              }
              jerseyNumbers.add(jerseyNum);

              if (player.isCaptain) {
                if (hasCaptain) {
                  rowErrors.push(`Only one captain allowed per team`);
                  return;
                }
                hasCaptain = true;
              }

              if (player.isGoalkeeper) {
                if (hasGoalkeeper) {
                  rowErrors.push(`Only one goalkeeper allowed per team`);
                  return;
                }
                hasGoalkeeper = true;
              }

              validPlayers.push({
                id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: player.name.trim(),
                position: player.position || 'Forward',
                jerseyNumber: jerseyNum,
                isCaptain: player.isCaptain === true || player.isCaptain === 'true',
                isGoalkeeper: player.isGoalkeeper === true || player.isGoalkeeper === 'true'
              });
            });
          }
        } catch (e) {
          rowErrors.push('Invalid players data format. Must be valid JSON array');
        }
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
          manager: team.manager || '',
          players: validPlayers
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

  const parseExcelData = (arrayBuffer) => {
    try {
      const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      return data;
    } catch (e) {
      console.error('Excel parsing error:', e);
      return null;
    }
  };

  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]); // Clear previous errors
    
    if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = parseExcelData(e.target.result);
        if (data) {
          setJsonData(JSON.stringify(data, null, 2));
          setUploadMethod('xlsx');
          showNotification('Excel file loaded successfully', 'success');
        } else {
          setErrors([{ row: 1, team: 'Excel', errors: ['Failed to parse Excel file. Please check the file format.'] }]);
          showNotification('Failed to read Excel file', 'error');
        }
      };
      reader.onerror = () => {
        setErrors([{ row: 1, team: 'Excel', errors: ['Failed to read file.'] }]);
        showNotification('Failed to read Excel file', 'error');
      };
      reader.readAsArrayBuffer(selectedFile);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        if (selectedFile.name.endsWith('.csv')) {
          setCsvData(content);
          setUploadMethod('csv');
          showNotification('CSV file loaded successfully', 'success');
        } else if (selectedFile.name.endsWith('.json')) {
          setJsonData(content);
          setUploadMethod('json');
          showNotification('JSON file loaded successfully', 'success');
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  const previewDataHandler = () => {
    setErrors([]);
    setPreviewData([]);
    
    let teams = [];
    
    if (uploadMethod === 'csv') {
      teams = parseCsvData(csvData);
    } else if (uploadMethod === 'xlsx') {
      teams = parseJsonData(jsonData);
      if (!teams) {
        setErrors([{ row: 1, team: 'Excel', errors: ['Invalid Excel data format'] }]);
        return;
      }
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
          <h2 className="text-lg font-bold text-white tracking-tight">Bulk Upload Teams</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Instructions */}
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <h3 className="text-blue-400 font-semibold mb-2 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              How to Use Bulk Upload
            </h3>
            <ul className="space-y-1 text-sm text-blue-300">
              <li>• Download the template file (CSV, Excel, or JSON format)</li>
              <li>• Fill in team details: name, logo URL, stadium, founded year, manager</li>
              <li>• Add players with: name, position, jersey number (1-99), captain flag, goalkeeper flag</li>
              <li>• Each team must have only ONE captain and ONE goalkeeper</li>
              <li>• Jersey numbers must be unique within each team</li>
              <li>• Upload the file or paste the data below</li>
              <li>• Preview and validate before uploading</li>
            </ul>
          </div>

          {/* Upload Method Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Upload Method</label>
            <div className="flex flex-wrap gap-3">
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
                onClick={() => setUploadMethod('xlsx')}
                className={`px-4 py-2 rounded-lg font-medium tracking-tight transition-colors ${
                  uploadMethod === 'xlsx' 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                }`}
              >
                Excel Format
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
              accept={uploadMethod === 'csv' ? '.csv' : uploadMethod === 'xlsx' ? '.xlsx,.xls' : '.json'}
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

          {/* Manual Input - Only for CSV and JSON */}
          {uploadMethod !== 'xlsx' && (
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
          )}

          {/* Preview Button */}
          <div className="mb-6">
            <button
              onClick={previewDataHandler}
              className="btn-primary flex items-center"
              disabled={(uploadMethod === 'csv' && !csvData) || ((uploadMethod === 'json' || uploadMethod === 'xlsx') && !jsonData) || isProcessing}
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
                    <p className="text-sm text-accent-400 font-medium mt-1">
                      Players: {team.players?.length || 0}
                      {team.players?.length > 0 && (
                        <span className="text-gray-500 ml-1">
                          ({team.players.filter(p => p.isCaptain).length} C, {team.players.filter(p => p.isGoalkeeper).length} GK)
                        </span>
                      )}
                    </p>
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