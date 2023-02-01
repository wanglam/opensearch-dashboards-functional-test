/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import '../../../utils/plugins/ml-commons-dashboards/commands';

import {
  BASE_PATH,
  MLC_FIXTURE_BASE_PATH,
  MLC_PLUGIN_NAME,
} from '../../../utils/constants';

const currentTiem = new Date().getTime();
const SAMPLE_DATA_INDEX_NAME = 'five_centroids';
const RANDOOM_SAMPLE_DATA_INDEX_NAME = `${SAMPLE_DATA_INDEX_NAME}_${currentTiem}`;
const trainedModel = [
  {
    algorithm: 'KMEANS',
    body: {
      parameters: {
        centroids: 8,
        iterations: 10000,
        distance_type: 'EUCLIDEAN',
      },
      input_query: {
        _source: ['x', 'y'],
        size: 10000,
      },
      input_index: [RANDOOM_SAMPLE_DATA_INDEX_NAME],
    },
  },
  {
    algorithm: 'KMEANS',
    body: {
      parameters: {
        centroids: 5,
        iterations: 999,
        distance_type: 'EUCLIDEAN',
      },
      input_query: {
        _source: ['x', 'y'],
        size: 10000,
      },
      input_index: [RANDOOM_SAMPLE_DATA_INDEX_NAME],
    },
  },
  {
    algorithm: 'RCF_SUMMARIZE',
    body: {
      parameters: {
        max_k: 50,
        distance_type: 'L2',
      },
      input_query: {
        _source: ['x', 'y'],
        size: 10000,
      },
      input_index: ['five_centroids'],
    },
  },
];

describe('model list', () => {
  const models = [];

  before(() => {
    cy.createIndex(RANDOOM_SAMPLE_DATA_INDEX_NAME);
    return (
      cy
        .fixture(MLC_FIXTURE_BASE_PATH + 'sample_data_five_centroids.txt')
        .then((data) =>
          data.replaceAll(
            SAMPLE_DATA_INDEX_NAME,
            RANDOOM_SAMPLE_DATA_INDEX_NAME
          )
        )
        .then((sampleData) => {
          cy.bulk(sampleData);
        })
        // add for active index data
        .then(
          () =>
            new Promise((resolve) => {
              setTimeout(resolve, 1000);
            })
        )
        .then(() => {
          trainedModel.forEach((model) => {
            cy.trainModel(model).then(({ body: { model_id: modelId } }) => {
              models.push({
                algorithm: model.algorithm,
                modelId,
                parameters: model.body.parameters,
              });
            });
          });
        })
    );
  });

  after(() => {
    cy.deleteIndex(RANDOOM_SAMPLE_DATA_INDEX_NAME);
    let model;
    while ((model = models.pop())) {
      cy.deleteModel(model.modelId);
    }
  });

  beforeEach(() => {
    cy.visit(`${BASE_PATH}/app/${MLC_PLUGIN_NAME}/model-list`);
  });

  it('should display title and model list content', () => {
    cy.contains('Models');
    models.forEach(({ modelId: id }) => {
      cy.contains(id);
    });
  });

  it('should only contains imported algorithm equal KMEANS, centroids equal 5 and iterations equal 999 records', () => {
    cy.get('[data-test-subj="algorithm-selector"]').first().click();
    cy.get('[data-test-subj="algorithm-selector-KMEANS"]').trigger('click');

    cy.get('[data-test-subj="centroids-selector"]').first().click();
    cy.get('[data-test-subj="centroids-selector-5"]').trigger('click');

    cy.get('[data-test-subj="iterations-selector"]').first().click();
    cy.get('[data-test-subj="iterations-selector-999"]').trigger('click');

    models.forEach(
      ({ parameters: { centroids, iterations }, algorithm, modelId }) => {
        if (algorithm === 'KMEANS' && centroids === 5 && iterations === 999) {
          cy.contains(modelId);
        } else {
          cy.contains(modelId).should('not.exist');
        }
      }
    );
  });

  it('should show records by time range', () => {
    cy.get('input[placeholder="Train End Time"]').first().click();
    cy.get('.react-datepicker__navigation--previous').first().trigger('click');
    cy.get('[data-test-subj="globalLoadingIndicator-hidden"]').should('exist');

    models.forEach(({ modelId: id }) => {
      cy.contains(id).should('not.exist');
    });

    cy.get('.euiFormControlLayoutClearButton').first().click();
    cy.get('input[placeholder="Train Start Time"]').first().click();
    cy.get('.react-datepicker__day--today').first().click();

    cy.get('input[placeholder="Train End Time"]').first().click();
    cy.get('.react-datepicker__navigation--next').first().trigger('click');
    cy.get('.react-datepicker__day')
      .then(
        ($dayItems) =>
          $dayItems.length ===
          $dayItems.filter('.react-datepicker__day--disabled').length
      )
      .then((allDisabled) => {
        if (allDisabled) {
          cy.get('.react-datepicker__navigation--previous')
            .first()
            .trigger('click');
        }

        cy.get('.react-datepicker__day')
          .not('.react-datepicker__day--disabled')
          .last()
          .click();

        cy.get('.react-datepicker__time-list-item').first().click();
      })
      .then(() => {
        models.forEach(({ modelId: id }) => {
          cy.contains(id).should('exist');
        });
      });
  });

  it('should delete model after confirm click and remain record after cancel click', () => {
    const deleteId = models[0].modelId;
    const remainId = models[1].modelId;
    cy.get(`[data-test-subj='model-delete-button-${deleteId}']`)
      .first()
      .click();
    cy.contains('Confirm').click();
    cy.contains(deleteId).should('not.exist');
    models.shift();

    cy.get(`[data-test-subj='model-delete-button-${remainId}']`)
      .first()
      .click();
    cy.contains('Cancel').click();
    cy.contains(remainId).should('exist');
  });

  it('should go to the model detail page, show content and back to list', () => {
    cy.contains(models[0].modelId).click();
    cy.url().should('include', models[0].modelId);
    cy.contains(models[0].modelId).should('be.exist');
    cy.contains(models[0].algorithm).should('be.exist');

    cy.contains('Back to list').click();
    cy.url().should('include', 'model-list');
  });

  it('should display created async model in model list', () => {
    cy.trainModel({
      algorithm: 'KMEANS',
      body: {
        parameters: {
          centroids: 8,
          iterations: 10000,
          distance_type: 'EUCLIDEAN',
        },
        input_query: {
          _source: ['x', 'y'],
          size: 10000,
        },
        input_index: [RANDOOM_SAMPLE_DATA_INDEX_NAME],
      },
      async: true,
    })
      .then(({ body: { task_id: taskId } }) => taskId)
      .then((taskId) =>
        cy
          .getTrainedModelIdByTaskId(taskId)
          .then((modelId) => ({ modelId, taskId }))
      )
      .then(({ modelId, taskId }) => {
        cy.contains(modelId);
        cy.deleteModel(modelId);
        cy.deleteTask(taskId);
      });
  });
});
