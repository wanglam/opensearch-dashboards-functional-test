import { MLC_URL } from '../../../utils/constants';

describe('MLC Monitoring page', () => {
  let uploadedInfo;
  before(() => {
    uploadedInfo = cy.uploadModelByUrl();
  });

  after(() => {
    if (uploadedInfo) {
      cy.deleteMLCommonsModel(uploadedInfo.modelId);
      cy.deleteMLCommonsTask(uploadedInfo.taskId);
    }
  });

  it('should return to monitoring page when visit root', () => {
    cy.visit(MLC_URL.ROOT);
    cy.url().should('include', MLC_URL.MONITORING);
  });
  it('page elements should be exists', () => {
    cy.visit(MLC_URL.MONITORING);
    cy.get('h1').contains('Overview');
    cy.get('h3').contains('Deployed models');
  });
});
