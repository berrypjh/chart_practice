describe('demo-e2e', () => {
  beforeEach(() => {
    // 1. 데모 페이지 방문
    cy.visit('/');
  });

  it('should display the header', () => {
    // 헤더 텍스트 확인
    cy.get('h1').contains('2D Chart Library Demo');
  });

  it('should render canvas elements for charts', () => {
    // 2. Canvas 요소가 존재하는지 확인
    // Bar 차트와 Line 차트 두 개가 있으므로 length는 2여야 함
    cy.get('canvas').should('have.length', 2);

    // 첫 번째 캔버스가 화면에 보이는지 확인
    cy.get('canvas').first().should('be.visible');
  });

  it('should update charts when randomize button is clicked', () => {
    // 3. 인터랙션 테스트
    // 버튼 클릭 전 스크린샷이나 상태 체크 가능 (여기선 생략)

    cy.get('button').contains('Randomize Data').click();

    // 버튼 클릭 후 에러 없이 캔버스가 여전히 존재하는지 확인
    cy.get('canvas').should('have.length', 2);
  });
});
