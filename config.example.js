window.BROADCAST_PAGE_CONFIG = {
  version: "1.0.0",
  setupComplete: true,

  // 구글시트 주소에서 /d/ 와 /edit 사이 값을 입력하세요.
  spreadsheetId: "여기에_스프레드시트_ID",

  sheets: {
    fanInfo: "팬정보",
    currentDebts: "현재업보",
    honyodan: "호뇽단",
    games: "게임",
    notices: "공지",
    schedule: "스케줄표",
    settings: "설정",
    reports: "방송기록",
    clips: "클립메모"
  },

  useSampleDataOnError: true,
  adminSheetUrl: "",
  autoRefreshMinutes: 5,

  // 관리자 Apps Script 주소는 admin.html에서 저장해도 됩니다.
  adminApiUrl: "",
  expectedSheetVersion: "1.0.0"
};
