# 아이패드에서 3단계 배포하기

## 준비물
- GitHub 계정
- Cloudflare 계정
- Google Drive에 올린 구글시트
- 이 ZIP을 압축 해제한 폴더

## 1. 구글시트 공개
1. 구글시트 오른쪽 위 `공유`를 누릅니다.
2. 일반 액세스를 `링크가 있는 모든 사용자`로 바꿉니다.
3. 권한은 `뷰어`로 둡니다.
4. 주소를 복사합니다.

## 2. config.js 설정
1. ZIP 안의 `setup.html`을 배포 후 열거나, 구글시트 주소에서 `/d/`와 `/edit` 사이 값을 찾습니다.
2. `config.js`의 `spreadsheetId: ""` 안에 붙여 넣습니다.
3. 저장합니다.

예시:
```js
spreadsheetId: "1ABCDEF123456",
```

## 3. GitHub 저장소 만들기
1. GitHub에서 `+` → `New repository`를 누릅니다.
2. 이름은 `hansel-broadcast`를 추천합니다.
3. Public을 선택합니다.
4. README 자동생성은 끄고 `Create repository`를 누릅니다.

## 4. 파일 업로드
1. 저장소에서 `uploading an existing file`을 누릅니다.
2. 이 폴더 안 파일들을 업로드합니다.
3. 저장소 맨 위에 `index.html`이 바로 보여야 합니다.
4. 아래 `Commit changes`를 누릅니다.

올릴 파일:
- index.html
- style.css
- script.js
- config.js
- assets 폴더
- site.webmanifest
- robots.txt
- _headers

엑셀 파일과 설명 문서는 사이트 구동에 필수는 아닙니다.

## 5. Cloudflare Pages 연결
1. Cloudflare → Workers & Pages → Create를 누릅니다.
2. Pages → Connect to Git을 선택합니다.
3. GitHub를 연결하고 `hansel-broadcast` 저장소를 선택합니다.
4. Framework preset은 `None`으로 둡니다.
5. Build command는 비워둡니다.
6. Build output directory는 `/` 또는 비워둡니다.
7. Save and Deploy를 누릅니다.

완료되면 `프로젝트이름.pages.dev` 주소가 생깁니다.

## 6. 확인
- 업보 카드가 표시되는지
- 닉네임 또는 아이디 검색이 되는지
- 호뇽단 카드 클릭 시 선언문 사진이 뜨는지
- 공지·게임·스케줄이 표시되는지
- 페이지 아래 연결 상태가 `구글시트 연결됨`인지

## 이후 수정
- 구글시트 데이터: 시트만 수정 후 사이트 새로고침
- 디자인/기능: GitHub 파일 수정 후 Commit
- Cloudflare는 GitHub 변경을 자동 재배포
