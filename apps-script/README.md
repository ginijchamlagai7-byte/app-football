# Google Sheets Football Tournament Backend

This folder contains a complete Google Apps Script REST-style backend for a football tournament app. Each signed-in user gets a separate Google Spreadsheet database in their own Google Drive.

## Template Sheets

The `setupDatabase()` function creates this Google Sheets template automatically:

| Sheet | Columns |
| --- | --- |
| `TOURNAMENTS` | `TournamentID`, `TournamentName`, `Season`, `Type` |
| `TEAMS` | `TeamID`, `TournamentID`, `TeamName`, `ShortName`, `LogoURL` |
| `PLAYERS` | `PlayerID`, `TeamID`, `PlayerName`, `JerseyNumber`, `Position` |
| `GROUPS` | `GroupID`, `TournamentID`, `GroupName` |
| `ROUNDS` | `RoundID`, `TournamentID`, `RoundName` |
| `MATCHES` | `MatchID`, `TournamentID`, `GroupID`, `RoundID`, `HomeTeamID`, `AwayTeamID`, `MatchDate`, `MatchTime`, `Status` |
| `MATCH_EVENTS` | `EventID`, `MatchID`, `Minute`, `EventType`, `TeamID`, `PlayerID` |
| `STANDINGS` | `TeamID`, `Played`, `Won`, `Draw`, `Lost`, `GF`, `GA`, `GD`, `Points` |

## Privacy Model

- Deploy the web app as **Execute as: User accessing the web app**.
- Set access to your intended Google users, for example **Anyone with Google account**.
- On first request, Apps Script creates a spreadsheet in that user's Drive.
- The spreadsheet ID is stored in `PropertiesService.getUserProperties()`, so users do not share data.
- Avoid deploying as **Me**, because then every frontend user would write to the script owner's spreadsheet.

## Deploy

1. Open [script.google.com](https://script.google.com).
2. Create a new Apps Script project.
3. Paste [Code.gs](./Code.gs) into the project.
4. Save.
5. Click **Deploy > New deployment > Web app**.
6. Set **Execute as** to **User accessing the web app**.
7. Set **Who has access** to your required audience.
8. Deploy and copy the Web App URL.

## API Shape

All responses are JSON:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

Use `POST` with a JSON body for writes and computed reads. `GET` also works for simple actions using query parameters.

## Supported Actions

- `setupDatabase`
- `createTournament`
- `createTeam`
- `createPlayer`
- `createGroup`
- `createRound`
- `createKnockoutStages`
- `createMatch`
- `generateFixtures`
- `saveMatchEvent`
- `getStandings`
- `getFixtures`
- `list`

## Frontend Fetch Helper

```js
const API_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

async function api(action, payload = {}) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify({ action, ...payload })
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Apps Script API error');
  }
  return result.data;
}
```

Apps Script web apps are commonly called with `text/plain` to avoid browser preflight issues.

## Examples

Create a tournament:

```js
const tournament = await api('createTournament', {
  TournamentName: 'City Champions Cup',
  Season: '2026',
  Type: 'Hybrid'
});
```

Create groups:

```js
const groupA = await api('createGroup', {
  TournamentID: tournament.TournamentID,
  GroupName: 'Group A'
});
```

Create teams:

```js
const lions = await api('createTeam', {
  TournamentID: tournament.TournamentID,
  TeamName: 'Kathmandu Lions',
  ShortName: 'KTL',
  LogoURL: 'https://example.com/lions.png'
});

const stars = await api('createTeam', {
  TournamentID: tournament.TournamentID,
  TeamName: 'Valley Stars',
  ShortName: 'VST'
});
```

Create players:

```js
await api('createPlayer', {
  TeamID: lions.TeamID,
  PlayerName: 'Aarav Shrestha',
  JerseyNumber: 10,
  Position: 'Forward'
});
```

Create knockout stages with direct entry to Quarter Final, Semi Final, or Final:

```js
const knockout = await api('createKnockoutStages', {
  TournamentID: tournament.TournamentID,
  EntryStage: 'Quarter Final'
});
```

Create a match manually:

```js
const match = await api('createMatch', {
  TournamentID: tournament.TournamentID,
  GroupID: groupA.GroupID,
  RoundID: knockout.rounds[0].RoundID,
  HomeTeamID: lions.TeamID,
  AwayTeamID: stars.TeamID,
  MatchDate: '2026-08-01',
  MatchTime: '18:00',
  Status: 'Scheduled'
});
```

Auto-generate league or group fixtures:

```js
const fixtures = await api('generateFixtures', {
  TournamentID: tournament.TournamentID,
  GroupID: groupA.GroupID,
  TeamIDs: [lions.TeamID, stars.TeamID],
  Mode: 'Group',
  RoundName: 'Group A Round Robin',
  DoubleRoundRobin: false
});
```

Save match events:

```js
await api('saveMatchEvent', {
  MatchID: match.MatchID,
  Minute: 27,
  EventType: 'GOAL',
  TeamID: lions.TeamID,
  PlayerID: 'P_PLAYER_ID',
  Status: 'Completed'
});
```

Get auto-generated standings:

```js
const standings = await api('getStandings', {
  TournamentID: tournament.TournamentID
});
```

Get fixtures with team names, round names, group names, and score:

```js
const fixtureList = await api('getFixtures', {
  TournamentID: tournament.TournamentID
});
```

List any sheet:

```js
const teams = await api('list', {
  sheetName: 'TEAMS'
});
```

## Event Types

Standings use only scoring events:

- `GOAL`
- `OWN_GOAL`

Other events such as `YELLOW_CARD`, `RED_CARD`, `SUBSTITUTION`, `ASSIST`, or `PENALTY_MISS` are stored but do not affect standings.
