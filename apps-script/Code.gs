var DB_NAME = 'Football Tournament Backend';

var SHEET_HEADERS = {
  TOURNAMENTS: ['TournamentID', 'TournamentName', 'Season', 'Type'],
  TEAMS: ['TeamID', 'TournamentID', 'TeamName', 'ShortName', 'LogoURL'],
  PLAYERS: ['PlayerID', 'TeamID', 'PlayerName', 'JerseyNumber', 'Position'],
  GROUPS: ['GroupID', 'TournamentID', 'GroupName'],
  ROUNDS: ['RoundID', 'TournamentID', 'RoundName'],
  MATCHES: [
    'MatchID',
    'TournamentID',
    'GroupID',
    'RoundID',
    'HomeTeamID',
    'AwayTeamID',
    'MatchDate',
    'MatchTime',
    'Status'
  ],
  MATCH_EVENTS: ['EventID', 'MatchID', 'Minute', 'EventType', 'TeamID', 'PlayerID'],
  STANDINGS: ['TeamID', 'Played', 'Won', 'Draw', 'Lost', 'GF', 'GA', 'GD', 'Points']
};

var VALID_TOURNAMENT_TYPES = ['League', 'Group', 'Knockout', 'Hybrid'];
var KNOCKOUT_ROUNDS = ['Round of 16', 'Quarter Final', 'Semi Final', 'Final'];

function doGet(e) {
  return handleRequest('GET', e);
}

function doPost(e) {
  return handleRequest('POST', e);
}

function handleRequest(method, e) {
  try {
    setupDatabase();

    var request = buildRequest(method, e);
    var action = request.action;
    var payload = request.payload;

    if (!action) {
      return jsonResponse(true, {
        message: 'Football Tournament Management API',
        spreadsheetId: getDatabase().getId(),
        availableActions: [
          'setupDatabase',
          'createTournament',
          'createTeam',
          'createPlayer',
          'createGroup',
          'createRound',
          'createKnockoutStages',
          'createMatch',
          'generateFixtures',
          'saveMatchEvent',
          'getStandings',
          'getFixtures',
          'list'
        ]
      });
    }

    var result = route(action, payload);
    return jsonResponse(true, result);
  } catch (err) {
    return jsonResponse(false, null, err && err.message ? err.message : String(err));
  }
}

function buildRequest(method, e) {
  var params = e && e.parameter ? e.parameter : {};
  var payload = {};

  if (method === 'POST' && e && e.postData && e.postData.contents) {
    payload = JSON.parse(e.postData.contents);
  } else {
    payload = cloneObject(params);
  }

  return {
    action: payload.action || params.action || '',
    payload: payload
  };
}

function route(action, payload) {
  switch (action) {
    case 'setupDatabase':
      return setupDatabase();
    case 'createTournament':
      return createTournament(payload);
    case 'createTeam':
      return createTeam(payload);
    case 'createPlayer':
      return createPlayer(payload);
    case 'createGroup':
      return createGroup(payload);
    case 'createRound':
      return createRound(payload);
    case 'createKnockoutStages':
      return createKnockoutStages(payload);
    case 'createMatch':
      return createMatch(payload);
    case 'generateFixtures':
    case 'autoGenerateFixtures':
      return generateFixtures(payload);
    case 'saveMatchEvent':
      return saveMatchEvent(payload);
    case 'getStandings':
    case 'autoGenerateStandings':
      return getStandings(payload);
    case 'getFixtures':
      return getFixtures(payload);
    case 'list':
      return listSheet(payload.sheetName);
    default:
      throw new Error('Unknown action: ' + action);
  }
}

function setupDatabase() {
  var ss = getDatabase();

  Object.keys(SHEET_HEADERS).forEach(function (sheetName) {
    var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
    ensureHeaders(sheet, SHEET_HEADERS[sheetName]);
  });

  var firstSheet = ss.getSheets()[0];
  if (firstSheet.getName() === 'Sheet1' && Object.keys(SHEET_HEADERS).indexOf('Sheet1') === -1) {
    ss.deleteSheet(firstSheet);
  }

  return {
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    sheets: Object.keys(SHEET_HEADERS)
  };
}

function getDatabase() {
  var userProps = PropertiesService.getUserProperties();
  var spreadsheetId = userProps.getProperty('FOOTBALL_DB_SPREADSHEET_ID');

  if (spreadsheetId) {
    try {
      return SpreadsheetApp.openById(spreadsheetId);
    } catch (err) {
      userProps.deleteProperty('FOOTBALL_DB_SPREADSHEET_ID');
    }
  }

  var ss = SpreadsheetApp.create(DB_NAME + ' - ' + Session.getEffectiveUser().getEmail());
  userProps.setProperty('FOOTBALL_DB_SPREADSHEET_ID', ss.getId());
  return ss;
}

function createTournament(data) {
  requireFields(data, ['TournamentName', 'Season', 'Type']);
  if (VALID_TOURNAMENT_TYPES.indexOf(data.Type) === -1) {
    throw new Error('Type must be one of: ' + VALID_TOURNAMENT_TYPES.join(', '));
  }

  var row = {
    TournamentID: data.TournamentID || makeId('T'),
    TournamentName: data.TournamentName,
    Season: data.Season,
    Type: data.Type
  };

  appendObject('TOURNAMENTS', row);
  return row;
}

function createTeam(data) {
  requireFields(data, ['TournamentID', 'TeamName']);
  assertExists('TOURNAMENTS', 'TournamentID', data.TournamentID);

  var row = {
    TeamID: data.TeamID || makeId('TEAM'),
    TournamentID: data.TournamentID,
    TeamName: data.TeamName,
    ShortName: data.ShortName || '',
    LogoURL: data.LogoURL || ''
  };

  appendObject('TEAMS', row);
  seedStanding(row.TeamID);
  return row;
}

function createPlayer(data) {
  requireFields(data, ['TeamID', 'PlayerName']);
  assertExists('TEAMS', 'TeamID', data.TeamID);

  var row = {
    PlayerID: data.PlayerID || makeId('P'),
    TeamID: data.TeamID,
    PlayerName: data.PlayerName,
    JerseyNumber: data.JerseyNumber || '',
    Position: data.Position || ''
  };

  appendObject('PLAYERS', row);
  return row;
}

function createGroup(data) {
  requireFields(data, ['TournamentID', 'GroupName']);
  assertExists('TOURNAMENTS', 'TournamentID', data.TournamentID);

  var row = {
    GroupID: data.GroupID || makeId('G'),
    TournamentID: data.TournamentID,
    GroupName: data.GroupName
  };

  appendObject('GROUPS', row);
  return row;
}

function createRound(data) {
  requireFields(data, ['TournamentID', 'RoundName']);
  assertExists('TOURNAMENTS', 'TournamentID', data.TournamentID);

  var row = {
    RoundID: data.RoundID || makeId('R'),
    TournamentID: data.TournamentID,
    RoundName: data.RoundName
  };

  appendObject('ROUNDS', row);
  return row;
}

function createKnockoutStages(data) {
  requireFields(data, ['TournamentID']);
  assertExists('TOURNAMENTS', 'TournamentID', data.TournamentID);

  var entryStage = data.EntryStage || data.RoundName || 'Quarter Final';
  if (KNOCKOUT_ROUNDS.indexOf(entryStage) === -1) {
    throw new Error('EntryStage must be one of: ' + KNOCKOUT_ROUNDS.join(', '));
  }

  var startIndex = KNOCKOUT_ROUNDS.indexOf(entryStage);
  var created = [];
  for (var i = startIndex; i < KNOCKOUT_ROUNDS.length; i++) {
    created.push(createRound({
      TournamentID: data.TournamentID,
      RoundName: KNOCKOUT_ROUNDS[i]
    }));
  }

  return {
    TournamentID: data.TournamentID,
    EntryStage: entryStage,
    rounds: created
  };
}

function createMatch(data) {
  requireFields(data, ['TournamentID', 'HomeTeamID', 'AwayTeamID']);
  assertExists('TOURNAMENTS', 'TournamentID', data.TournamentID);
  assertExists('TEAMS', 'TeamID', data.HomeTeamID);
  assertExists('TEAMS', 'TeamID', data.AwayTeamID);

  var row = {
    MatchID: data.MatchID || makeId('M'),
    TournamentID: data.TournamentID,
    GroupID: data.GroupID || '',
    RoundID: data.RoundID || '',
    HomeTeamID: data.HomeTeamID,
    AwayTeamID: data.AwayTeamID,
    MatchDate: data.MatchDate || '',
    MatchTime: data.MatchTime || '',
    Status: data.Status || 'Scheduled'
  };

  appendObject('MATCHES', row);
  return row;
}

function generateFixtures(data) {
  requireFields(data, ['TournamentID']);
  assertExists('TOURNAMENTS', 'TournamentID', data.TournamentID);

  var mode = data.Mode || 'League';
  var teams = getTeamsForFixture(data);
  if (teams.length < 2) {
    throw new Error('At least two teams are required to generate fixtures.');
  }

  var roundId = data.RoundID || '';
  if (!roundId && (mode === 'League' || mode === 'Group')) {
    roundId = createRound({
      TournamentID: data.TournamentID,
      RoundName: data.RoundName || (mode === 'Group' ? 'Group Stage' : 'League Stage')
    }).RoundID;
  }

  var created = [];
  for (var i = 0; i < teams.length; i++) {
    for (var j = i + 1; j < teams.length; j++) {
      created.push(createMatch({
        TournamentID: data.TournamentID,
        GroupID: data.GroupID || '',
        RoundID: roundId,
        HomeTeamID: teams[i].TeamID,
        AwayTeamID: teams[j].TeamID,
        MatchDate: data.MatchDate || '',
        MatchTime: data.MatchTime || '',
        Status: 'Scheduled'
      }));

      if (data.DoubleRoundRobin === true) {
        created.push(createMatch({
          TournamentID: data.TournamentID,
          GroupID: data.GroupID || '',
          RoundID: roundId,
          HomeTeamID: teams[j].TeamID,
          AwayTeamID: teams[i].TeamID,
          MatchDate: data.MatchDate || '',
          MatchTime: data.MatchTime || '',
          Status: 'Scheduled'
        }));
      }
    }
  }

  return {
    TournamentID: data.TournamentID,
    GroupID: data.GroupID || '',
    RoundID: roundId,
    fixturesCreated: created.length,
    fixtures: created
  };
}

function saveMatchEvent(data) {
  requireFields(data, ['MatchID', 'Minute', 'EventType', 'TeamID']);
  assertExists('MATCHES', 'MatchID', data.MatchID);
  assertExists('TEAMS', 'TeamID', data.TeamID);
  if (data.PlayerID) {
    assertExists('PLAYERS', 'PlayerID', data.PlayerID);
  }

  var row = {
    EventID: data.EventID || makeId('E'),
    MatchID: data.MatchID,
    Minute: data.Minute,
    EventType: data.EventType,
    TeamID: data.TeamID,
    PlayerID: data.PlayerID || ''
  };

  appendObject('MATCH_EVENTS', row);

  if (data.Status) {
    updateRow('MATCHES', 'MatchID', data.MatchID, { Status: data.Status });
  }

  var match = findOne('MATCHES', 'MatchID', data.MatchID);
  refreshStandings(match.TournamentID);

  return {
    event: row,
    standings: getStandings({ TournamentID: match.TournamentID }).standings
  };
}

function getStandings(data) {
  requireFields(data, ['TournamentID']);
  refreshStandings(data.TournamentID);

  var teams = listSheet('TEAMS').rows.filter(function (team) {
    return team.TournamentID === data.TournamentID;
  });
  var teamIds = teams.map(function (team) {
    return team.TeamID;
  });
  var teamById = indexBy(teams, 'TeamID');

  var standings = listSheet('STANDINGS').rows.filter(function (row) {
    return teamIds.indexOf(row.TeamID) !== -1;
  }).map(function (row) {
    var team = teamById[row.TeamID] || {};
    row.TeamName = team.TeamName || '';
    row.ShortName = team.ShortName || '';
    return row;
  }).sort(sortStandings);

  return {
    TournamentID: data.TournamentID,
    standings: standings
  };
}

function getFixtures(data) {
  requireFields(data, ['TournamentID']);

  var teams = indexBy(listSheet('TEAMS').rows, 'TeamID');
  var groups = indexBy(listSheet('GROUPS').rows, 'GroupID');
  var rounds = indexBy(listSheet('ROUNDS').rows, 'RoundID');

  var fixtures = listSheet('MATCHES').rows.filter(function (match) {
    if (match.TournamentID !== data.TournamentID) {
      return false;
    }
    if (data.GroupID && match.GroupID !== data.GroupID) {
      return false;
    }
    if (data.RoundID && match.RoundID !== data.RoundID) {
      return false;
    }
    return true;
  }).map(function (match) {
    match.HomeTeamName = teams[match.HomeTeamID] ? teams[match.HomeTeamID].TeamName : '';
    match.AwayTeamName = teams[match.AwayTeamID] ? teams[match.AwayTeamID].TeamName : '';
    match.GroupName = groups[match.GroupID] ? groups[match.GroupID].GroupName : '';
    match.RoundName = rounds[match.RoundID] ? rounds[match.RoundID].RoundName : '';
    match.Score = getMatchScore(match.MatchID);
    return match;
  });

  return {
    TournamentID: data.TournamentID,
    fixtures: fixtures
  };
}

function refreshStandings(tournamentId) {
  var teams = listSheet('TEAMS').rows.filter(function (team) {
    return team.TournamentID === tournamentId;
  });
  var matches = listSheet('MATCHES').rows.filter(function (match) {
    return match.TournamentID === tournamentId;
  });

  var table = {};
  teams.forEach(function (team) {
    table[team.TeamID] = emptyStanding(team.TeamID);
  });

  matches.forEach(function (match) {
    var score = getMatchScore(match.MatchID);
    if (!isCompletedMatch(match, score)) {
      return;
    }

    var home = table[match.HomeTeamID] || emptyStanding(match.HomeTeamID);
    var away = table[match.AwayTeamID] || emptyStanding(match.AwayTeamID);

    home.Played++;
    away.Played++;
    home.GF += score.home;
    home.GA += score.away;
    away.GF += score.away;
    away.GA += score.home;

    if (score.home > score.away) {
      home.Won++;
      home.Points += 3;
      away.Lost++;
    } else if (score.home < score.away) {
      away.Won++;
      away.Points += 3;
      home.Lost++;
    } else {
      home.Draw++;
      away.Draw++;
      home.Points++;
      away.Points++;
    }

    home.GD = home.GF - home.GA;
    away.GD = away.GF - away.GA;
    table[match.HomeTeamID] = home;
    table[match.AwayTeamID] = away;
  });

  replaceStandingsForTeams(Object.keys(table), Object.keys(table).map(function (teamId) {
    return table[teamId];
  }));
}

function getMatchScore(matchId) {
  var match = findOne('MATCHES', 'MatchID', matchId);
  var events = listSheet('MATCH_EVENTS').rows.filter(function (event) {
    return event.MatchID === matchId;
  });

  var score = { home: 0, away: 0 };
  events.forEach(function (event) {
    var type = String(event.EventType || '').toUpperCase();
    if (type !== 'GOAL' && type !== 'OWN_GOAL') {
      return;
    }

    if (type === 'OWN_GOAL') {
      if (event.TeamID === match.HomeTeamID) {
        score.away++;
      } else if (event.TeamID === match.AwayTeamID) {
        score.home++;
      }
      return;
    }

    if (event.TeamID === match.HomeTeamID) {
      score.home++;
    } else if (event.TeamID === match.AwayTeamID) {
      score.away++;
    }
  });

  return score;
}

function isCompletedMatch(match, score) {
  var status = String(match.Status || '').toLowerCase();
  return status === 'completed' || status === 'finished' || status === 'full time' || score.home + score.away > 0;
}

function replaceStandingsForTeams(teamIds, rows) {
  var sheet = getSheet('STANDINGS');
  var current = readRows(sheet);
  var kept = current.rows.filter(function (row) {
    return teamIds.indexOf(row.TeamID) === -1;
  });
  var allRows = kept.concat(rows).sort(sortStandings);

  sheet.clearContents();
  sheet.getRange(1, 1, 1, SHEET_HEADERS.STANDINGS.length).setValues([SHEET_HEADERS.STANDINGS]);
  if (allRows.length > 0) {
    sheet.getRange(2, 1, allRows.length, SHEET_HEADERS.STANDINGS.length).setValues(allRows.map(function (row) {
      return objectToRow(row, SHEET_HEADERS.STANDINGS);
    }));
  }
}

function seedStanding(teamId) {
  if (!findOne('STANDINGS', 'TeamID', teamId, true)) {
    appendObject('STANDINGS', emptyStanding(teamId));
  }
}

function emptyStanding(teamId) {
  return {
    TeamID: teamId,
    Played: 0,
    Won: 0,
    Draw: 0,
    Lost: 0,
    GF: 0,
    GA: 0,
    GD: 0,
    Points: 0
  };
}

function getTeamsForFixture(data) {
  var teams = listSheet('TEAMS').rows.filter(function (team) {
    return team.TournamentID === data.TournamentID;
  });

  if (data.TeamIDs && data.TeamIDs.length) {
    teams = teams.filter(function (team) {
      return data.TeamIDs.indexOf(team.TeamID) !== -1;
    });
  }

  return teams;
}

function listSheet(sheetName) {
  if (!sheetName || !SHEET_HEADERS[sheetName]) {
    throw new Error('Invalid sheetName.');
  }

  var sheet = getSheet(sheetName);
  return {
    sheetName: sheetName,
    rows: readRows(sheet).rows
  };
}

function appendObject(sheetName, obj) {
  var sheet = getSheet(sheetName);
  var headers = SHEET_HEADERS[sheetName];
  sheet.appendRow(objectToRow(obj, headers));
}

function updateRow(sheetName, keyName, keyValue, patch) {
  var sheet = getSheet(sheetName);
  var data = readRows(sheet);
  var rowIndex = -1;

  for (var i = 0; i < data.rows.length; i++) {
    if (data.rows[i][keyName] === keyValue) {
      rowIndex = i + 2;
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error(sheetName + ' row not found for ' + keyName + ': ' + keyValue);
  }

  Object.keys(patch).forEach(function (field) {
    var colIndex = data.headers.indexOf(field);
    if (colIndex !== -1) {
      sheet.getRange(rowIndex, colIndex + 1).setValue(patch[field]);
    }
  });
}

function findOne(sheetName, keyName, keyValue, optional) {
  var rows = listSheet(sheetName).rows;
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][keyName] === keyValue) {
      return rows[i];
    }
  }

  if (optional) {
    return null;
  }
  throw new Error(sheetName + ' row not found for ' + keyName + ': ' + keyValue);
}

function assertExists(sheetName, keyName, keyValue) {
  findOne(sheetName, keyName, keyValue);
}

function readRows(sheet) {
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length === 0) {
    return { headers: [], rows: [] };
  }

  var headers = values[0];
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    if (isBlankRow(values[i])) {
      continue;
    }

    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = values[i][j];
    }
    rows.push(obj);
  }

  return { headers: headers, rows: rows };
}

function getSheet(sheetName) {
  var sheet = getDatabase().getSheetByName(sheetName);
  if (!sheet) {
    sheet = getDatabase().insertSheet(sheetName);
    ensureHeaders(sheet, SHEET_HEADERS[sheetName]);
  }
  return sheet;
}

function ensureHeaders(sheet, expectedHeaders) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(expectedHeaders);
    return;
  }

  var existing = sheet.getRange(1, 1, 1, expectedHeaders.length).getValues()[0];
  var changed = false;
  for (var i = 0; i < expectedHeaders.length; i++) {
    if (existing[i] !== expectedHeaders[i]) {
      changed = true;
      break;
    }
  }

  if (changed) {
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
  }
}

function objectToRow(obj, headers) {
  return headers.map(function (header) {
    return obj[header] !== undefined && obj[header] !== null ? obj[header] : '';
  });
}

function sortStandings(a, b) {
  return numberValue(b.Points) - numberValue(a.Points) ||
    numberValue(b.GD) - numberValue(a.GD) ||
    numberValue(b.GF) - numberValue(a.GF) ||
    String(a.TeamID).localeCompare(String(b.TeamID));
}

function indexBy(rows, key) {
  var map = {};
  rows.forEach(function (row) {
    map[row[key]] = row;
  });
  return map;
}

function numberValue(value) {
  var parsed = Number(value);
  return isNaN(parsed) ? 0 : parsed;
}

function requireFields(data, fields) {
  if (!data) {
    throw new Error('Missing request body.');
  }

  fields.forEach(function (field) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      throw new Error('Missing required field: ' + field);
    }
  });
}

function isBlankRow(row) {
  return row.join('') === '';
}

function cloneObject(obj) {
  var clone = {};
  Object.keys(obj || {}).forEach(function (key) {
    clone[key] = obj[key];
  });
  return clone;
}

function makeId(prefix) {
  return prefix + '_' + Utilities.getUuid().split('-')[0].toUpperCase();
}

function jsonResponse(success, data, error) {
  var body = {
    success: success,
    data: data || null,
    error: error || null
  };

  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}
