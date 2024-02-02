/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  TestFixtureHandler,
  MiscUtils,
} from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { CURRENT_TENANT } from '../../../../../utils/commands';

const miscUtils = new MiscUtils(cy);
const testFixtureHandler = new TestFixtureHandler(
  cy,
  Cypress.env('openSearchUrl')
);

describe('index pattern without field spec', () => {
  before(() => {
    CURRENT_TENANT.newTenant = 'global';
    testFixtureHandler.importJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/index_pattern_without_timefield/mappings.json.txt'
    );

    testFixtureHandler.importJSONDoc(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/index_pattern_without_timefield/data.json.txt'
    );

    cy.setAdvancedSetting({
      defaultIndex: 'without-timefield',
    });

    // Go to the Discover page
    miscUtils.visitPage('app/data-explorer/discover#/');
    cy.waitForLoader();
  });

  after(() => {
    testFixtureHandler.clearJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/index_pattern_without_timefield/mappings.json.txt'
    );
  });

  it('should not display a timepicker', () => {
    cy.getElementByTestId('superDatePickerToggleQuickMenuButton').should(
      'not.exist'
    );
  });

  it('should display a timepicker after switching to an index pattern with timefield', () => {
    // cy.intercept('POST', '/api/saved_objects/_bulk_get').as(
    //   'getIndexPatternDetail'
    // );
    const indexName = 'with-timefield';
    cy.getElementByTestId('comboBoxToggleListButton')
      .should('be.visible')
      .click();
    cy.contains('button', indexName).click();
    cy.waitForLoader();
    // cy.wait('@getIndexPatternDetail').then((req) => {
    //   req.response.body.saved_objects.forEach((item) => {
    //     if (item.error) {
    //       Cypress.log({
    //         displayName: 'error',
    //         message: `[${item.id}]-${item.type}`,
    //       });
    //     }
    //   });
    // });
    cy.request({
      url: '/api/saved_objects/_bulk_get',
      method: 'POST',
      body: JSON.stringify([{ type: 'index-pattern', id: indexName }]),
      headers: {
        'content-type': 'application/json',
        'osd-xsrf': true,
      },
    }).then(({ body }) => {
      const savedObject = body.saved_objects[0];
      if (
        savedObject &&
        savedObject.attributes &&
        savedObject.attributes.timeFieldName
      ) {
        cy.log('find:' + JSON.stringify(savedObject.attributes.timeFieldName));
      } else {
        cy.log('fallback' + JSON.stringify(savedObject));
      }
    });

    if (Cypress.env('SECURITY_ENABLED')) {
      cy.request(`/api/v1/auth/dashboardsinfo`).then(({ body }) => {
        cy.log(JSON.stringify(body));
      });
      cy.request(
        `${Cypress.env('openSearchUrl')}/_plugins/_security/api/tenancy/config`
      ).then(({ body }) => {
        cy.log(JSON.stringify(body));
      });
    }
    cy.getElementByTestId('superDatePickerToggleQuickMenuButton').should(
      'be.visible'
    );
  });
});
