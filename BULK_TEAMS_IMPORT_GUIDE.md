# Bulk Teams Import Guide

## Overview
This guide explains how to import multiple teams with all their details using the Bulk Upload feature.

## Supported Formats
- **CSV** (Comma Separated Values)
- **Excel** (.xlsx or .xls spreadsheet)
- **JSON** (JavaScript Object Notation)

## Team Data Structure

### Required Fields
- `name` - Team name (required)

### Optional Fields
- `logo` - URL to team logo image (PNG, JPG, SVG, etc.)
- `stadium` - Stadium name
- `founded` - Year founded (1800 - current year)
- `manager` - Current manager/coach name
- `players` - Array of player objects (see below)

## Player Data Structure

Each player object must have:
- `name` - Player name (required)
- `position` - Player position: "Forward", "Midfielder", "Defender", or "Goalkeeper"
- `jerseyNumber` - Jersey number (1-99, must be unique per team)
- `isCaptain` - Boolean: true/false (only ONE captain per team)
- `isGoalkeeper` - Boolean: true/false (only ONE goalkeeper per team)

## CSV Format Example

```csv
name,logo,stadium,founded,manager,players
Arsenal,https://example.com/arsenal-logo.png,Emirates Stadium,1886,Mikel Arteta,"[{""name"":""Bukayo Saka"",""position"":""Forward"",""jerseyNumber"":""7"",""isCaptain"":false,""isGoalkeeper"":false},{""name"":""Martin Odegaard"",""position"":""Midfielder"",""jerseyNumber"":""8"",""isCaptain"":true,""isGoalkeeper"":false},{""name"":""Aaron Ramsdale"",""position"":""Goalkeeper"",""jerseyNumber"":""1"",""isCaptain"":false,""isGoalkeeper"":true}]"
Chelsea,https://example.com/chelsea-logo.png,Stamford Bridge,1905,Mauricio Pochettino,"[{""name"":""Cole Palmer"",""position"":""Forward"",""jerseyNumber"":""20"",""isCaptain"":false,""isGoalkeeper"":false},{""name"":""Reece James"",""position"":""Defender"",""jerseyNumber"":""24"",""isCaptain"":true,""isGoalkeeper"":false}]"
```

**Note for CSV:** Players data must be a JSON string with double quotes escaped (`""`)

## Excel Format Example

Excel (.xlsx) format is the easiest way to import teams! Download the template and fill in the spreadsheet:

| name | logo | stadium | founded | manager | players |
|------|------|---------|---------|---------|---------|
| Arsenal | https://example.com/arsenal-logo.png | Emirates Stadium | 1886 | Mikel Arteta | [{"name":"Bukayo Saka","position":"Forward","jerseyNumber":"7","isCaptain":false,"isGoalkeeper":false},{"name":"Martin Odegaard","position":"Midfielder","jerseyNumber":"8","isCaptain":true,"isGoalkeeper":false}] |
| Chelsea | https://example.com/chelsea-logo.png | Stamford Bridge | 1905 | Mauricio Pochettino | [{"name":"Cole Palmer","position":"Forward","jerseyNumber":"20","isCaptain":false,"isGoalkeeper":false}] |

**Note for Excel:** 
- Each row represents one team
- Players column should contain a JSON array (same format as CSV)
- Excel template will be pre-formatted with examples

## JSON Format Example

```json
[
  {
    "name": "Arsenal",
    "logo": "https://example.com/arsenal-logo.png",
    "stadium": "Emirates Stadium",
    "founded": "1886",
    "manager": "Mikel Arteta",
    "players": [
      {
        "name": "Bukayo Saka",
        "position": "Forward",
        "jerseyNumber": "7",
        "isCaptain": false,
        "isGoalkeeper": false
      },
      {
        "name": "Martin Odegaard",
        "position": "Midfielder",
        "jerseyNumber": "8",
        "isCaptain": true,
        "isGoalkeeper": false
      },
      {
        "name": "Aaron Ramsdale",
        "position": "Goalkeeper",
        "jerseyNumber": "1",
        "isCaptain": false,
        "isGoalkeeper": true
      },
      {
        "name": "William Saliba",
        "position": "Defender",
        "jerseyNumber": "2",
        "isCaptain": false,
        "isGoalkeeper": false
      },
      {
        "name": "Gabriel Jesus",
        "position": "Forward",
        "jerseyNumber": "9",
        "isCaptain": false,
        "isGoalkeeper": false
      }
    ]
  },
  {
    "name": "Chelsea",
    "logo": "https://example.com/chelsea-logo.png",
    "stadium": "Stamford Bridge",
    "founded": "1905",
    "manager": "Mauricio Pochettino",
    "players": [
      {
        "name": "Cole Palmer",
        "position": "Forward",
        "jerseyNumber": "20",
        "isCaptain": false,
        "isGoalkeeper": false
      },
      {
        "name": "Reece James",
        "position": "Defender",
        "jerseyNumber": "24",
        "isCaptain": true,
        "isGoalkeeper": false
      },
      {
        "name": "Robert Sanchez",
        "position": "Goalkeeper",
        "jerseyNumber": "1",
        "isCaptain": false,
        "isGoalkeeper": true
      }
    ]
  }
]
```

## Simple Format (Without Players)

If you don't want to add players initially, you can use this simpler format:

### CSV
```csv
name,logo,stadium,founded,manager
Arsenal,https://example.com/arsenal-logo.png,Emirates Stadium,1886,Mikel Arteta
Chelsea,https://example.com/chelsea-logo.png,Stamford Bridge,1905,Mauricio Pochettino
Manchester United,https://example.com/manutd-logo.png,Old Trafford,1878,Erik ten Hag
```

### JSON
```json
[
  {
    "name": "Arsenal",
    "logo": "https://example.com/arsenal-logo.png",
    "stadium": "Emirates Stadium",
    "founded": "1886",
    "manager": "Mikel Arteta"
  },
  {
    "name": "Chelsea",
    "logo": "https://example.com/chelsea-logo.png",
    "stadium": "Stamford Bridge",
    "founded": "1905",
    "manager": "Mauricio Pochettino"
  }
]
```

## Validation Rules

1. **Team Name**: Required, cannot be empty
2. **Founded Year**: Must be between 1800 and current year
3. **Logo URL**: Must be a valid image URL (jpg, png, svg, gif, webp)
4. **Jersey Numbers**: Must be 1-99 and unique within each team
5. **Captain**: Only ONE player per team can be captain
6. **Goalkeeper**: Only ONE player per team can be goalkeeper
7. **Player Positions**: Forward, Midfielder, Defender, or Goalkeeper

## Common Positions
- **Goalkeeper**: GK
- **Defender**: CB (Center Back), LB (Left Back), RB (Right Back), LWB, RWB
- **Midfielder**: CDM, CM, CAM, LM, RM, DM
- **Forward**: ST (Striker), CF, LW (Left Winger), RW (Right Winger)

## Tips

1. **Logo URLs**: Use reliable image hosting services (imgur, cloudinary, etc.)
2. **Players**: Add at least 11 players for a complete starting lineup
3. **Testing**: Start with 1-2 teams to test the format before uploading all teams
4. **Preview**: Always preview and validate data before final upload
5. **Excel Recommended**: Excel format (.xlsx) is the easiest for most users - works like a spreadsheet!
6. **JSON Alternative**: JSON format is good if you're comfortable with code/data files

## Step-by-Step Process

1. Click "Bulk Upload Teams" in Admin Dashboard
2. Choose CSV, Excel, or JSON format
3. Click "Download Template" to get a sample file
4. Edit the template file with your team data
   - **Excel**: Edit cells directly in Excel/Google Sheets
   - **CSV**: Edit in text editor or spreadsheet app
   - **JSON**: Edit in text editor
5. Upload the file (Excel doesn't support manual paste)
6. Click "Preview & Validate Data"
7. Check for any validation errors
8. If no errors, click "Upload Teams"
9. Success! Your teams are now imported

## Troubleshooting

### "Invalid JSON format"
- Check that all brackets, quotes, and commas are properly placed
- Use a JSON validator online to check your data

### "Jersey number already used"
- Make sure each player in a team has a unique jersey number

### "Only one captain/goalkeeper allowed"
- Check that only ONE player per team has `isCaptain: true`
- Check that only ONE player per team has `isGoalkeeper: true`

### "Logo must be a valid image URL"
- Make sure the URL starts with http:// or https://
- Make sure it ends with .jpg, .png, .svg, .gif, or .webp

## Need Help?

If you encounter issues, check:
1. The validation error messages
2. The preview to see which teams/players have issues
3. This guide for format examples
4. Download the template and compare with your data
