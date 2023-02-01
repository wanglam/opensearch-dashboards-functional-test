import { MLC_API } from './constants';

Cypress.Commands.add('trainModel', ({ algorithm, body, async }) =>
  cy.request(
    'POST',
    `${Cypress.env('openSearchUrl')}${MLC_API.TRAIN_BASE}/${algorithm}${
      async ? '?async=true' : ''
    }`,
    body
  )
);

Cypress.Commands.add('deleteModel', (modelId) =>
  cy.request(
    'DELETE',
    `${Cypress.env('openSearchUrl')}${MLC_API.MODEL_BASE}/${modelId}`
  )
);

Cypress.Commands.add('bulk', (body) =>
  cy.request({
    method: 'POST',
    url: `${Cypress.env('openSearchUrl')}/_bulk`,
    headers: {
      'content-type': 'application/x-ndjson',
    },
    body,
  })
);

Cypress.Commands.add('getTask', (taskId) =>
  cy.request({
    method: 'GET',
    url: `${Cypress.env('openSearchUrl')}${MLC_API.TASK_BASE}/${taskId}`,
  })
);

Cypress.Commands.add('getTrainedModelIdByTaskId', (taskId) =>
  cy.getTask(taskId).then(({ body }) => {
    console.log(body['model_id'], body);
    if (body['model_id']) {
      return body['model_id'];
    }
    return new Promise((resolve) => {
      setTimeout(resolve, 200);
    }).then(() => cy.getTrainedModelIdByTaskId(taskId));
  })
);

Cypress.Commands.add('deleteTask', (taskId) =>
  cy.request(
    'DELETE',
    `${Cypress.env('openSearchUrl')}${MLC_API.TASK_BASE}/${taskId}`
  )
);
