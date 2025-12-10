import React, { useState } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import NewTeamAvatar from './NewTeamAvatar';
import { useFootball } from '../context/FootballContext';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
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
  const { t } = useLanguage();

  if (!isOpen) return null;

  const csvTemplate = `name,logo,stadium,founded,manager,players
Arsenal,https://logos-world.net/wp-content/uploads/2020/06/Arsenal-Logo.png,Emirates Stadium,1886,Mikel Arteta,"[{""name"":""Bukayo Saka"",""position"":""Forward"",""jerseyNumber"":""7"",""isCaptain"":false,""isGoalkeeper"":false,""dateOfBirth"":""2001-09-05"",""placeOfBirth"":""London, England"",""nationality"":""England"",""height"":""178"",""preferredFoot"":""left"",""marketValue"":""€120M"",""contractExpiry"":""2027-06-30""},{""name"":""Martin Odegaard"",""position"":""Midfielder"",""jerseyNumber"":""8"",""isCaptain"":true,""isGoalkeeper"":false,""dateOfBirth"":""1998-12-17"",""placeOfBirth"":""Drammen, Norway"",""nationality"":""Norway"",""height"":""178"",""preferredFoot"":""left"",""marketValue"":""€110M"",""contractExpiry"":""2028-06-30""},{""name"":""Aaron Ramsdale"",""position"":""Goalkeeper"",""jerseyNumber"":""1"",""isCaptain"":false,""isGoalkeeper"":true,""dateOfBirth"":""1998-05-14"",""placeOfBirth"":""Stoke-on-Trent, England"",""nationality"":""England"",""height"":""188"",""preferredFoot"":""right"",""marketValue"":""€30M"",""contractExpiry"":""2026-06-30""}]"
Chelsea,https://logos-world.net/wp-content/uploads/2020/06/Chelsea-Logo.png,Stamford Bridge,1905,Mauricio Pochettino,"[{""name"":""Cole Palmer"",""position"":""Forward"",""jerseyNumber"":""20"",""isCaptain"":false,""isGoalkeeper"":false,""dateOfBirth"":""2002-05-06"",""placeOfBirth"":""Wythenshawe, England"",""nationality"":""England"",""height"":""189"",""preferredFoot"":""left"",""marketValue"":""€80M"",""contractExpiry"":""2030-06-30""},{""name"":""Reece James"",""position"":""Defender"",""jerseyNumber"":""24"",""isCaptain"":true,""isGoalkeeper"":false,""dateOfBirth"":""1999-12-08"",""placeOfBirth"":""Redbridge, England"",""nationality"":""England"",""height"":""182"",""preferredFoot"":""right"",""marketValue"":""€70M"",""contractExpiry"":""2028-06-30""},{""name"":""Robert Sanchez"",""position"":""Goalkeeper"",""jerseyNumber"":""1"",""isCaptain"":false,""isGoalkeeper"":true,""dateOfBirth"":""1997-11-18"",""placeOfBirth"":""Cartagena, Spain"",""nationality"":""Spain"",""height"":""197"",""preferredFoot"":""left"",""marketValue"":""€25M"",""contractExpiry"":""2030-06-30""}]"
Manchester United,https://logos-world.net/wp-content/uploads/2020/06/Manchester-United-Logo.png,Old Trafford,1878,Erik ten Hag,"[{""name"":""Marcus Rashford"",""position"":""Forward"",""jerseyNumber"":""10"",""isCaptain"":false,""isGoalkeeper"":false,""dateOfBirth"":""1997-10-31"",""placeOfBirth"":""Manchester, England"",""nationality"":""England"",""height"":""180"",""preferredFoot"":""right"",""marketValue"":""€75M"",""contractExpiry"":""2028-06-30""},{""name"":""Bruno Fernandes"",""position"":""Midfielder"",""jerseyNumber"":""8"",""isCaptain"":true,""isGoalkeeper"":false,""dateOfBirth"":""1994-09-08"",""placeOfBirth"":""Maia, Portugal"",""nationality"":""Portugal"",""height"":""179"",""preferredFoot"":""right"",""marketValue"":""€80M"",""contractExpiry"":""2026-06-30""},{""name"":""Andre Onana"",""position"":""Goalkeeper"",""jerseyNumber"":""24"",""isCaptain"":false,""isGoalkeeper"":true,""dateOfBirth"":""1996-04-02"",""placeOfBirth"":""Nkol Ngok, Cameroon"",""nationality"":""Cameroon"",""height"":""190"",""preferredFoot"":""right"",""marketValue"":""€40M"",""contractExpiry"":""2028-06-30""}]"`;

  const jsonTemplate = JSON.stringify([
    {
      name: "Arsenal",
      logo: "https://logos-world.net/wp-content/uploads/2020/06/Arsenal-Logo.png",
      stadium: "Emirates Stadium",
      founded: "1886",
      manager: "Mikel Arteta",
      players: [
        { name: "Bukayo Saka", position: "Forward", jerseyNumber: "7", isCaptain: false, isGoalkeeper: false, dateOfBirth: "2001-09-05", placeOfBirth: "London, England", nationality: "England", height: "178", preferredFoot: "left", marketValue: "€120M", contractExpiry: "2027-06-30" },
        { name: "Martin Odegaard", position: "Midfielder", jerseyNumber: "8", isCaptain: true, isGoalkeeper: false, dateOfBirth: "1998-12-17", placeOfBirth: "Drammen, Norway", nationality: "Norway", height: "178", preferredFoot: "left", marketValue: "€110M", contractExpiry: "2028-06-30" },
        { name: "Aaron Ramsdale", position: "Goalkeeper", jerseyNumber: "1", isCaptain: false, isGoalkeeper: true, dateOfBirth: "1998-05-14", placeOfBirth: "Stoke-on-Trent, England", nationality: "England", height: "188", preferredFoot: "right", marketValue: "€30M", contractExpiry: "2026-06-30" },
        { name: "William Saliba", position: "Defender", jerseyNumber: "2", isCaptain: false, isGoalkeeper: false, dateOfBirth: "2001-03-24", placeOfBirth: "Bondy, France", nationality: "France", height: "192", preferredFoot: "right", marketValue: "€80M", contractExpiry: "2027-06-30" },
        { name: "Gabriel Jesus", position: "Forward", jerseyNumber: "9", isCaptain: false, isGoalkeeper: false, dateOfBirth: "1997-04-03", placeOfBirth: "São Paulo, Brazil", nationality: "Brazil", height: "175", preferredFoot: "right", marketValue: "€70M", contractExpiry: "2027-06-30" }
      ]
    },
    {
      name: "Chelsea", 
      logo: "https://logos-world.net/wp-content/uploads/2020/06/Chelsea-Logo.png",
      stadium: "Stamford Bridge",
      founded: "1905",
      manager: "Mauricio Pochettino",
      players: [
        { name: "Cole Palmer", position: "Forward", jerseyNumber: "20", isCaptain: false, isGoalkeeper: false, dateOfBirth: "2002-05-06", placeOfBirth: "Wythenshawe, England", nationality: "England", height: "189", preferredFoot: "left", marketValue: "€80M", contractExpiry: "2030-06-30" },
        { name: "Reece James", position: "Defender", jerseyNumber: "24", isCaptain: true, isGoalkeeper: false, dateOfBirth: "1999-12-08", placeOfBirth: "Redbridge, England", nationality: "England", height: "182", preferredFoot: "right", marketValue: "€70M", contractExpiry: "2028-06-30" },
        { name: "Robert Sanchez", position: "Goalkeeper", jerseyNumber: "1", isCaptain: false, isGoalkeeper: true, dateOfBirth: "1997-11-18", placeOfBirth: "Cartagena, Spain", nationality: "Spain", height: "197", preferredFoot: "left", marketValue: "€25M", contractExpiry: "2030-06-30" },
        { name: "Enzo Fernandez", position: "Midfielder", jerseyNumber: "5", isCaptain: false, isGoalkeeper: false, dateOfBirth: "2001-01-17", placeOfBirth: "San Martín, Argentina", nationality: "Argentina", height: "178", preferredFoot: "right", marketValue: "€75M", contractExpiry: "2031-06-30" },
        { name: "Nicolas Jackson", position: "Forward", jerseyNumber: "15", isCaptain: false, isGoalkeeper: false, dateOfBirth: "2001-06-20", placeOfBirth: "Banjul, Gambia", nationality: "Senegal", height: "185", preferredFoot: "right", marketValue: "€40M", contractExpiry: "2031-06-30" }
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
            { name: "Bukayo Saka", position: "Forward", jerseyNumber: "7", isCaptain: false, isGoalkeeper: false, dateOfBirth: "2001-09-05", placeOfBirth: "London, England", nationality: "England", height: "178", preferredFoot: "left", marketValue: "€120M", contractExpiry: "2027-06-30" },
            { name: "Martin Odegaard", position: "Midfielder", jerseyNumber: "8", isCaptain: true, isGoalkeeper: false, dateOfBirth: "1998-12-17", placeOfBirth: "Drammen, Norway", nationality: "Norway", height: "178", preferredFoot: "left", marketValue: "€110M", contractExpiry: "2028-06-30" },
            { name: "Aaron Ramsdale", position: "Goalkeeper", jerseyNumber: "1", isCaptain: false, isGoalkeeper: true, dateOfBirth: "1998-05-14", placeOfBirth: "Stoke-on-Trent, England", nationality: "England", height: "188", preferredFoot: "right", marketValue: "€30M", contractExpiry: "2026-06-30" }
          ])
        },
        {
          name: "Chelsea",
          logo: "https://logos-world.net/wp-content/uploads/2020/06/Chelsea-Logo.png",
          stadium: "Stamford Bridge",
          founded: "1905",
          manager: "Mauricio Pochettino",
          players: JSON.stringify([
            { name: "Cole Palmer", position: "Forward", jerseyNumber: "20", isCaptain: false, isGoalkeeper: false, dateOfBirth: "2002-05-06", placeOfBirth: "Wythenshawe, England", nationality: "England", height: "189", preferredFoot: "left", marketValue: "€80M", contractExpiry: "2030-06-30" },
            { name: "Reece James", position: "Defender", jerseyNumber: "24", isCaptain: true, isGoalkeeper: false, dateOfBirth: "1999-12-08", placeOfBirth: "Redbridge, England", nationality: "England", height: "182", preferredFoot: "right", marketValue: "€70M", contractExpiry: "2028-06-30" },
            { name: "Robert Sanchez", position: "Goalkeeper", jerseyNumber: "1", isCaptain: false, isGoalkeeper: true, dateOfBirth: "1997-11-18", placeOfBirth: "Cartagena, Spain", nationality: "Spain", height: "197", preferredFoot: "left", marketValue: "€25M", contractExpiry: "2030-06-30" }
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
        rowErrors.push(t('bulkUpload.teamNameRequired'));
      }
      
      if (team.founded && (isNaN(team.founded) || team.founded < 1800 || team.founded > new Date().getFullYear())) {
        rowErrors.push(t('bulkUpload.foundedYearRange'));
      }
      
      if (team.logo && !team.logo.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        rowErrors.push(t('bulkUpload.logoValidUrl'));
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
                rowErrors.push(t('bulkUpload.playerNameRequired').replace('{index}', pIndex + 1));
                return;
              }

              const jerseyNum = parseInt(player.jerseyNumber);
              if (!jerseyNum || jerseyNum < 1 || jerseyNum > 99) {
                rowErrors.push(t('bulkUpload.jerseyNumberRange').replace('{name}', player.name));
                return;
              }

              if (jerseyNumbers.has(jerseyNum)) {
                rowErrors.push(t('bulkUpload.jerseyNumberUsed').replace('{name}', player.name).replace('{number}', jerseyNum));
                return;
              }
              jerseyNumbers.add(jerseyNum);

              if (player.isCaptain) {
                if (hasCaptain) {
                  rowErrors.push(t('bulkUpload.oneCaptainPerTeam'));
                  return;
                }
                hasCaptain = true;
              }

              if (player.isGoalkeeper) {
                if (hasGoalkeeper) {
                  rowErrors.push(t('bulkUpload.oneGoalkeeperPerTeam'));
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
          rowErrors.push(t('bulkUpload.invalidPlayersFormat'));
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
          logo: (team.logo || '').trim(),
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
          showNotification(t('bulkUpload.excelLoaded'), 'success');
        } else {
          setErrors([{ row: 1, team: 'Excel', errors: [t('bulkUpload.excelParseFailed')] }]);
          showNotification(t('bulkUpload.excelReadFailed'), 'error');
        }
      };
      reader.onerror = () => {
        setErrors([{ row: 1, team: 'Excel', errors: [t('bulkUpload.fileReadFailed')] }]);
        showNotification(t('bulkUpload.excelReadFailed'), 'error');
      };
      reader.readAsArrayBuffer(selectedFile);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        if (selectedFile.name.endsWith('.csv')) {
          setCsvData(content);
          setUploadMethod('csv');
          showNotification(t('bulkUpload.csvLoaded'), 'success');
        } else if (selectedFile.name.endsWith('.json')) {
          setJsonData(content);
          setUploadMethod('json');
          showNotification(t('bulkUpload.jsonLoaded'), 'success');
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
        setErrors([{ row: 1, team: 'Excel', errors: [t('bulkUpload.invalidExcelFormat')] }]);
        return;
      }
    } else {
      teams = parseJsonData(jsonData);
      if (!teams) {
        setErrors([{ row: 1, team: 'JSON', errors: [t('bulkUpload.invalidJsonFormat')] }]);
        return;
      }
    }
    
    if (teams.length === 0) {
      setErrors([{ row: 1, team: 'Data', errors: [t('bulkUpload.noValidData')] }]);
      return;
    }
    
    const { errors: validationErrors, validTeams } = validateTeamData(teams);
    setErrors(validationErrors);
    setPreviewData(validTeams);
  };

  const handleUpload = async () => {
    if (previewData.length === 0) {
      showNotification(t('bulkUpload.noTeamsToUpload'), 'error');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      await addBulkTeams(previewData);
      showNotification(t('bulkUpload.uploadSuccess').replace('{count}', previewData.length), 'success');
      onClose();
    } catch (error) {
      showNotification(t('bulkUpload.uploadFailed'), 'error');
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
          <h2 className="text-lg font-bold text-white tracking-tight">{t('bulkUpload.title')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Instructions */}
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <h3 className="text-blue-400 font-semibold mb-2 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              {t('bulkUpload.howToUse')}
            </h3>
            <ul className="space-y-1 text-sm text-blue-300">
              <li>• {t('bulkUpload.instruction1')}</li>
              <li>• {t('bulkUpload.instruction2')}</li>
              <li>• {t('bulkUpload.instruction3')}</li>
              <li>• {t('bulkUpload.instruction4')}</li>
              <li>• {t('bulkUpload.instruction5')}</li>
              <li>• {t('bulkUpload.instruction6')}</li>
              <li>• {t('bulkUpload.instruction7')}</li>
            </ul>
          </div>

          {/* Upload Method Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('bulkUpload.uploadMethod')}</label>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setUploadMethod('csv')}
                className={`px-4 py-2 rounded-lg font-medium tracking-tight transition-colors ${
                  uploadMethod === 'csv' 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                }`}
              >
                {t('bulkUpload.csvFormat')}
              </button>
              <button
                onClick={() => setUploadMethod('xlsx')}
                className={`px-4 py-2 rounded-lg font-medium tracking-tight transition-colors ${
                  uploadMethod === 'xlsx' 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                }`}
              >
                {t('bulkUpload.excelFormat')}
              </button>
              <button
                onClick={() => setUploadMethod('json')}
                className={`px-4 py-2 rounded-lg font-medium tracking-tight transition-colors ${
                  uploadMethod === 'json' 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                }`}
              >
                {t('bulkUpload.jsonFormat')}
              </button>
            </div>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('bulkUpload.uploadFile')}</label>
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
              {t('bulkUpload.downloadTemplate').replace('{format}', uploadMethod.toUpperCase())}
            </button>
          </div>

          {/* Manual Input - Only for CSV and JSON */}
          {uploadMethod !== 'xlsx' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('bulkUpload.pasteData').replace('{format}', uploadMethod.toUpperCase())}
              </label>
              <textarea
                value={uploadMethod === 'csv' ? csvData : jsonData}
                onChange={(e) => uploadMethod === 'csv' ? setCsvData(e.target.value) : setJsonData(e.target.value)}
                placeholder={t('bulkUpload.pasteDataPlaceholder').replace('{format}', uploadMethod.toUpperCase())}
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
              {t('bulkUpload.previewValidate')}
            </button>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <h3 className="text-red-400 font-semibold mb-2">{t('bulkUpload.validationErrors')}</h3>
              <ul className="space-y-1 text-sm text-red-300">
                {errors.map((error, index) => (
                  <li key={index}>
                    {t('bulkUpload.row')} {error.row} ({error.team}): {error.errors.join(', ')}
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
                {t('bulkUpload.previewReady').replace('{count}', previewData.length)}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto">
                {previewData.slice(0, 10).map((team, index) => (
                  <div key={index} className="bg-dark-800 border border-dark-700 rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      <NewTeamAvatar team={team} size={32} className="mr-3 rounded" />
                      <h4 className="font-semibold text-white">{team.name}</h4>
                    </div>
                    <p className="text-sm text-gray-400">{t('bulkUpload.stadium')}: {team.stadium || t('common.notSpecified')}</p>
                    <p className="text-sm text-gray-400">{t('bulkUpload.founded')}: {team.founded || t('common.notSpecified')}</p>
                    <p className="text-sm text-gray-400">{t('bulkUpload.manager')}: {team.manager || t('common.notSpecified')}</p>
                    <p className="text-sm text-accent-400 font-medium mt-1">
                      {t('bulkUpload.players')}: {team.players?.length || 0}
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
                    {t('bulkUpload.moreTeams').replace('{count}', previewData.length - 10)}
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
              {isProcessing ? t('bulkUpload.uploading') : t('bulkUpload.uploadTeams').replace('{count}', previewData.length)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkTeamUpload;
