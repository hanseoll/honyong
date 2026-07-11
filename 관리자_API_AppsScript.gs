/**
 * 한설 방송용 페이지 11단계 관리자 API
 *
 * 설치:
 * 1) 구글시트에서 확장 프로그램 → Apps Script
 * 2) 이 파일 전체를 Code.gs에 붙여넣기
 * 3) setAdminSecret() 안의 비밀번호를 바꾸고 한 번 실행
 * 4) 배포 → 새 배포 → 웹 앱
 * 5) 실행 사용자: 나
 * 6) 액세스 권한: 모든 사용자
 * 7) 배포된 /exec 주소를 admin.html 설정에 입력
 */

const SHEETS = {
  fans: '팬정보',
  debts: '현재업보',
  honyo: '호뇽단',
  games: '게임',
  notices: '공지',
  schedule: '스케줄표'
};

function setAdminSecret() {
  // 반드시 본인만 아는 긴 비밀번호로 바꾸세요.
  PropertiesService.getScriptProperties().setProperty(
    'ADMIN_SECRET',
    '여기를_긴_관리자_비밀번호로_바꾸세요'
  );
}

function doGet() {
  return HtmlService.createHtmlOutput('Honyong admin API is running.');
}

function doPost(e) {
  const p = (e && e.parameter) || {};
  const requestId = p.requestId || '';
  try {
    verifySecret_(p.secret);
    let data;

    switch (p.action) {
      case 'ping':
        data = { message: 'ok' };
        break;
      case 'listDebts':
        data = { rows: listDebts_() };
        break;
      case 'updateDebt':
        data = updateDebt_(p);
        break;
      case 'saveHonyo':
        data = saveHonyo_(p);
        break;
      case 'addNotice':
        data = addNotice_(p);
        break;
      case 'addSchedule':
        data = addSchedule_(p);
        break;
      case 'saveGame':
        data = saveGame_(p);
        break;
      default:
        throw new Error('알 수 없는 작업입니다.');
    }
    return response_(requestId, true, data, '');
  } catch (error) {
    return response_(requestId, false, null, error.message || String(error));
  }
}

function verifySecret_(received) {
  const saved = PropertiesService.getScriptProperties().getProperty('ADMIN_SECRET');
  if (!saved || saved.indexOf('여기를_') === 0) {
    throw new Error('Apps Script에서 관리자 비밀번호를 먼저 설정하세요.');
  }
  if (String(received || '') !== saved) {
    throw new Error('관리자 비밀번호가 올바르지 않습니다.');
  }
}

function response_(requestId, ok, data, error) {
  const payload = JSON.stringify({
    source: 'honyong-admin',
    requestId: requestId,
    ok: ok,
    data: data,
    error: error
  }).replace(/</g, '\\u003c');

  return HtmlService.createHtmlOutput(
    '<!doctype html><meta charset="utf-8"><script>' +
    'window.parent.postMessage(' + payload + ', "*");' +
    '<\/script>'
  ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function ss_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function sheet_(name) {
  const sheet = ss_().getSheetByName(name);
  if (!sheet) throw new Error('구글시트에 "' + name + '" 탭이 없습니다.');
  return sheet;
}

function headers_(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const values = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0];
  const map = {};
  values.forEach(function(value, index) {
    map[String(value).trim().toLowerCase()] = index + 1;
  });
  return map;
}

function col_(headers, names, required) {
  for (let i = 0; i < names.length; i++) {
    const key = String(names[i]).trim().toLowerCase();
    if (headers[key]) return headers[key];
  }
  if (required !== false) {
    throw new Error('필수 열을 찾지 못했습니다: ' + names.join(' / '));
  }
  return 0;
}

function text_(value) {
  return String(value == null ? '' : value).trim();
}

function positiveInt_(value, allowZero) {
  const number = Math.floor(Number(value));
  if (!Number.isFinite(number) || number < (allowZero ? 0 : 1)) {
    throw new Error('수량은 ' + (allowZero ? '0 이상의' : '1 이상의') + ' 숫자로 입력하세요.');
  }
  return number;
}

function listDebts_() {
  const sheet = sheet_(SHEETS.debts);
  if (sheet.getLastRow() < 2) return [];

  const h = headers_(sheet);
  const nicknameCol = col_(h, ['nickname', '닉네임']);
  const typeCol = col_(h, ['업보종류', 'type', '종류']);
  const countCol = col_(h, ['개수', 'count']);

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  return rows.map(function(row) {
    return {
      nickname: text_(row[nicknameCol - 1]),
      type: text_(row[typeCol - 1]),
      count: Number(row[countCol - 1]) || 0
    };
  }).filter(function(row) {
    return row.nickname && row.type && row.count > 0;
  }).sort(function(a, b) {
    return a.nickname.localeCompare(b.nickname, 'ko') || a.type.localeCompare(b.type, 'ko');
  });
}

function updateDebt_(p) {
  const nickname = text_(p.nickname);
  const debtType = text_(p.debtType);
  const amount = positiveInt_(p.amount, p.mode === 'set');
  const mode = text_(p.mode) || 'add';

  if (!nickname) throw new Error('닉네임을 입력하세요.');
  if (!debtType) throw new Error('업보 종류를 선택하세요.');

  const sheet = sheet_(SHEETS.debts);
  const h = headers_(sheet);
  const nicknameCol = col_(h, ['nickname', '닉네임']);
  const typeCol = col_(h, ['업보종류', 'type', '종류']);
  const countCol = col_(h, ['개수', 'count']);
  const updatedCol = col_(h, ['updatedat', '업데이트'], false);
  const memoCol = col_(h, ['메모', 'memo'], false);

  const matches = [];
  let total = 0;

  if (sheet.getLastRow() >= 2) {
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    rows.forEach(function(row, index) {
      if (text_(row[nicknameCol - 1]) === nickname && text_(row[typeCol - 1]) === debtType) {
        matches.push(index + 2);
        total += Number(row[countCol - 1]) || 0;
      }
    });
  }

  let newCount;
  if (mode === 'subtract') newCount = total - amount;
  else if (mode === 'set') newCount = amount;
  else newCount = total + amount;

  if (newCount <= 0) {
    matches.sort(function(a, b) { return b - a; }).forEach(function(rowNumber) {
      sheet.deleteRow(rowNumber);
    });
    ensureFan_(nickname, '');
    return { nickname: nickname, debtType: debtType, newCount: 0, deleted: true };
  }

  let targetRow;
  if (matches.length) {
    targetRow = matches[0];
  } else {
    targetRow = Math.max(sheet.getLastRow() + 1, 2);
  }

  sheet.getRange(targetRow, nicknameCol).setValue(nickname);
  sheet.getRange(targetRow, typeCol).setValue(debtType);
  sheet.getRange(targetRow, countCol).setValue(newCount);
  if (updatedCol) sheet.getRange(targetRow, updatedCol).setValue(new Date());
  if (memoCol && !matches.length) sheet.getRange(targetRow, memoCol).setValue('관리자 페이지');

  matches.slice(1).sort(function(a, b) { return b - a; }).forEach(function(rowNumber) {
    sheet.deleteRow(rowNumber);
  });

  ensureFan_(nickname, '');
  return { nickname: nickname, debtType: debtType, newCount: newCount };
}

function ensureFan_(nickname, fanId) {
  const sheet = sheet_(SHEETS.fans);
  const h = headers_(sheet);
  const nicknameCol = col_(h, ['nickname', '닉네임']);
  const idCol = col_(h, ['id', '아이디'], false);

  if (sheet.getLastRow() >= 2) {
    const values = sheet.getRange(2, nicknameCol, sheet.getLastRow() - 1, 1).getDisplayValues();
    for (let i = 0; i < values.length; i++) {
      if (text_(values[i][0]) === nickname) {
        if (fanId && idCol) sheet.getRange(i + 2, idCol).setValue(fanId);
        return i + 2;
      }
    }
  }

  const row = Math.max(sheet.getLastRow() + 1, 2);
  sheet.getRange(row, nicknameCol).setValue(nickname);
  if (fanId && idCol) sheet.getRange(row, idCol).setValue(fanId);
  return row;
}

function saveHonyo_(p) {
  const nickname = text_(p.nickname);
  const fanId = text_(p.fanId);
  const image = text_(p.statementImage);
  const memo = text_(p.memo);

  if (!nickname) throw new Error('닉네임을 입력하세요.');
  if (!image) throw new Error('본진선언문 사진 주소를 입력하세요.');

  ensureFan_(nickname, fanId);

  const sheet = sheet_(SHEETS.honyo);
  const h = headers_(sheet);
  const nicknameCol = col_(h, ['nickname', '닉네임']);
  const imageCol = col_(h, ['선언문사진', 'statementimage', '이미지']);
  const updatedCol = col_(h, ['updatedat', '업데이트'], false);
  const memoCol = col_(h, ['메모', 'memo'], false);

  let row = 0;
  if (sheet.getLastRow() >= 2) {
    const values = sheet.getRange(2, nicknameCol, sheet.getLastRow() - 1, 1).getDisplayValues();
    for (let i = 0; i < values.length; i++) {
      if (text_(values[i][0]) === nickname) {
        row = i + 2;
        break;
      }
    }
  }
  if (!row) row = Math.max(sheet.getLastRow() + 1, 2);

  sheet.getRange(row, nicknameCol).setValue(nickname);
  sheet.getRange(row, imageCol).setValue(image);
  if (updatedCol) sheet.getRange(row, updatedCol).setValue(new Date());
  if (memoCol) sheet.getRange(row, memoCol).setValue(memo);
  return { nickname: nickname };
}

function addNotice_(p) {
  const title = text_(p.title);
  const content = text_(p.content);
  if (!title || !content) throw new Error('공지 제목과 내용을 입력하세요.');

  const sheet = sheet_(SHEETS.notices);
  const h = headers_(sheet);
  const row = Math.max(sheet.getLastRow() + 1, 2);

  sheet.getRange(row, col_(h, ['category', '분류'])).setValue(text_(p.category) || '공지');
  sheet.getRange(row, col_(h, ['title', '제목'])).setValue(title);
  sheet.getRange(row, col_(h, ['content', '내용'])).setValue(content);

  const pinnedCol = col_(h, ['pinned', '고정'], false);
  const visibleCol = col_(h, ['visible', '표시'], false);
  const orderCol = col_(h, ['order', '순서'], false);
  if (pinnedCol) sheet.getRange(row, pinnedCol).setValue(text_(p.pinned));
  if (visibleCol) sheet.getRange(row, visibleCol).setValue('표시');
  if (orderCol) sheet.getRange(row, orderCol).setValue(nextOrder_(sheet, orderCol));
  return { row: row };
}

function addSchedule_(p) {
  const date = text_(p.date);
  const title = text_(p.title);
  if (!date || !title) throw new Error('날짜와 제목을 입력하세요.');

  const sheet = sheet_(SHEETS.schedule);
  const h = headers_(sheet);
  const row = Math.max(sheet.getLastRow() + 1, 2);

  sheet.getRange(row, col_(h, ['date', '날짜'])).setValue(new Date(date + 'T00:00:00'));
  sheet.getRange(row, col_(h, ['time', '시간'])).setValue(text_(p.time));
  sheet.getRange(row, col_(h, ['title', '제목'])).setValue(title);
  sheet.getRange(row, col_(h, ['type', '종류'])).setValue(text_(p.type) || '방송');

  const memoCol = col_(h, ['memo', '메모'], false);
  const visibleCol = col_(h, ['visible', '표시'], false);
  if (memoCol) sheet.getRange(row, memoCol).setValue(text_(p.memo));
  if (visibleCol) sheet.getRange(row, visibleCol).setValue('표시');
  return { row: row };
}

function saveGame_(p) {
  const title = text_(p.title);
  if (!title) throw new Error('게임 제목을 입력하세요.');

  const sheet = sheet_(SHEETS.games);
  const h = headers_(sheet);
  const titleCol = col_(h, ['title', '게임명', '제목']);
  let row = 0;

  if (sheet.getLastRow() >= 2) {
    const values = sheet.getRange(2, titleCol, sheet.getLastRow() - 1, 1).getDisplayValues();
    for (let i = 0; i < values.length; i++) {
      if (text_(values[i][0]).toLowerCase() === title.toLowerCase()) {
        row = i + 2;
        break;
      }
    }
  }
  if (!row) row = Math.max(sheet.getLastRow() + 1, 2);

  sheet.getRange(row, titleCol).setValue(title);
  sheet.getRange(row, col_(h, ['status', '상태'])).setValue(text_(p.status) || '할 게임');

  const imageCol = col_(h, ['image', '이미지'], false);
  const progressCol = col_(h, ['progress', '진행도'], false);
  const percentCol = col_(h, ['progresspercent', '진행률', '퍼센트'], false);
  const memoCol = col_(h, ['memo', '메모'], false);
  const orderCol = col_(h, ['order', '순서'], false);

  if (imageCol) sheet.getRange(row, imageCol).setValue(text_(p.image));
  if (progressCol) sheet.getRange(row, progressCol).setValue(text_(p.progress));
  if (percentCol) sheet.getRange(row, percentCol).setValue(positiveInt_(p.progressPercent || 0, true));
  if (memoCol) sheet.getRange(row, memoCol).setValue(text_(p.memo));
  if (orderCol && !sheet.getRange(row, orderCol).getValue()) {
    sheet.getRange(row, orderCol).setValue(nextOrder_(sheet, orderCol));
  }
  return { row: row, title: title };
}

function nextOrder_(sheet, orderCol) {
  if (sheet.getLastRow() < 2) return 1;
  const values = sheet.getRange(2, orderCol, sheet.getLastRow() - 1, 1).getValues();
  let max = 0;
  values.forEach(function(row) {
    const n = Number(row[0]) || 0;
    if (n > max) max = n;
  });
  return max + 1;
}
