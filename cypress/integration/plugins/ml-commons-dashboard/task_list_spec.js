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
    async: true,
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
    async: true,
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
    async: true,
  },
];

describe('task list', () => {
  const tasks = [];

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
            cy.trainModel(model).then(({ body: { task_id: taskId } }) => {
              tasks.push({
                algorithm: model.algorithm,
                taskId,
              });
            });
          });
        })
    );
  });

  after(() => {
    cy.deleteIndex(RANDOOM_SAMPLE_DATA_INDEX_NAME);
    let task;
    while ((task = tasks.pop())) {
      cy.getTrainedModelIdByTaskId(task.taskId).then((modelId) => {
        cy.deleteModel(modelId);
      });
      cy.deleteTask(task.taskId);
    }
  });

  beforeEach(() => {
    cy.visit(`${BASE_PATH}/app/${MLC_PLUGIN_NAME}/task-list`);
  });

  it('should display title and task list content', () => {
    cy.contains('Tasks');
    tasks.forEach(({ taskId: id }) => {
      cy.contains(id);
    });
  });

  it('should display consistent data by model ID filter', () => {
    Promise.all(
      tasks.map(
        ({ taskId }) =>
          new Promise((resolve, reject) => {
            cy.getTrainedModelIdByTaskId(taskId).then((modelId) => {
              resolve(modelId);
            }, reject);
          })
      )
    ).then((modelIDs) => {
      const filterIndex = Math.floor(Math.random() * modelIDs.length);
      cy.get('[data-test-subj="model-id-search"]').type(modelIDs[filterIndex]);
      modelIDs.forEach((modelID, index) => {
        if (index === filterIndex) {
          cy.contains(modelID);
          return;
        }
        cy.contains(modelID).should('not.exist');
      });
    });
  });

  it('should display consistent data by different functions', () => {
    cy.get('[data-test-subj="funtion-selector"]').click();
    cy.get('[data-test-subj="funtion-selector-RCF_SUMMARIZE"]').trigger(
      'click'
    );

    tasks.forEach(({ algorithm, taskId }) => {
      if (algorithm === 'RCF_SUMMARIZE') {
        cy.contains(taskId);
        return;
      }
      cy.contains(taskId).should('not.exist');
    });

    cy.get('[data-test-subj="funtion-selector"]').click();
    cy.get('[data-test-subj="funtion-selector-KMEANS"]').trigger('click');

    tasks.forEach(({ algorithm, taskId }) => {
      if (algorithm === 'KMEANS') {
        cy.contains(taskId);
        return;
      }
      cy.contains(taskId).should('not.exist');
    });
  });

  it('should show records by time range', () => {
    cy.get('input[placeholder="Create End Time"]').first().click();
    cy.get('.react-datepicker__navigation--previous').first().trigger('click');
    cy.get('[data-test-subj="globalLoadingIndicator-hidden"]').should('exist');

    tasks.forEach(({ taskId: id }) => {
      cy.contains(id).should('not.exist');
    });

    cy.get('.euiFormControlLayoutClearButton').first().click();
    cy.get('input[placeholder="Create Start Time"]').first().click();
    cy.get('.react-datepicker__day--today').first().click();

    cy.get('input[placeholder="Create End Time"]').first().click();
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
        tasks.forEach(({ taskId: id }) => {
          cy.contains(id).should('exist');
        });
      });
  });

  it('should delete task after confirm click and remain record after cancel click', () => {
    const deleteId = tasks[0].taskId;
    const remainId = tasks[1].taskId;
    cy.getTrainedModelIdByTaskId(deleteId).then((modelId) => {
      cy.deleteModel(modelId);
    });
    cy.get(`[data-test-subj='task-delete-button-${deleteId}']`).first().click();
    cy.contains('Confirm').click();
    cy.contains(deleteId).should('not.exist');
    tasks.shift();

    cy.get(`[data-test-subj='task-delete-button-${remainId}']`).first().click();
    cy.contains('Cancel').click();
    cy.contains(remainId).should('exist');
  });
});
