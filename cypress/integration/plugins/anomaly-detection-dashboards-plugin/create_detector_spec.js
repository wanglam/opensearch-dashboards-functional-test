/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// import { AD_FIXTURE_BASE_PATH, AD_URL } from '../../../utils/constants';
import { AD_FIXTURE_BASE_PATH } from '../../../utils/constants';
// import { selectTopItemFromFilter } from '../../../utils/helpers';

context('Create detector workflow', () => {
  // const TEST_DETECTOR_NAME = 'test-detector';
  // const TEST_DETECTOR_DESCRIPTION = 'Some test detector description.';
  // const TEST_FEATURE_NAME = 'test-feature';
  // const TEST_TIMESTAMP_NAME = 'timestamp'; // coming from single_index_response.json fixture
  const TEST_INDEX_NAME = 'sample-ad-index';

  // Index some sample data first
  beforeEach(() => {
    cy.deleteAllIndices();
    cy.deleteADSystemIndices();
    cy.fixture(AD_FIXTURE_BASE_PATH + 'sample_test_data.txt').then((data) => {
      cy.request({
        method: 'POST',
        form: false,
        url: 'api/console/proxy',
        headers: {
          'content-type': 'application/json;charset=UTF-8',
          'osd-xsrf': true,
        },
        qs: {
          path: `${TEST_INDEX_NAME}/_bulk`,
          method: 'POST',
        },
        body: data,
      });
    });
  });

  // Clean up created resources
  afterEach(() => {
    cy.deleteAllIndices();
    cy.deleteADSystemIndices();
  });

  it('Full creation - based on real index', () => {
    console.log('empty test case...');
  });
});
