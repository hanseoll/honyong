window.BROADCAST_PAGE_CONFIG = {
  // 구글시트 주소에서 /d/ 와 /edit 사이의 값을 붙여 넣으세요.
  // 예: https://docs.google.com/spreadsheets/d/여기가_ID/edit
  spreadsheetId: "1G8CBgiE-mrwWkVvuSvHHn7UVkC6mDWTvS5N2fXLfXus",

  // 기본 시트 이름입니다. 구글시트 탭 이름을 바꾸지 않았다면 수정하지 마세요.
  sheets: {
    fanInfo: "팬정보",
    currentDebts: "현재업보",
    honyodan: "호뇽단",
    games: "게임",
    notices: "공지",
    schedule: "스케줄표",
    settings: "설정"
  },

  // spreadsheetId가 비어 있거나 연결에 실패하면 샘플 데이터를 보여줍니다.
  useSampleDataOnError: true
,

  // 자동 새로고침 간격(분). 0이면 자동 새로고침을 끕니다.
  autoRefreshMinutes: 5
};
