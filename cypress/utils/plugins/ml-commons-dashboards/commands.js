import { MLC_API } from './constants';

Cypress.Commands.add('ensureUploadModelByUrl', (body) =>
  cy.uploadModelByUrl(body).then(({ task_id: taskId }) =>
    cy.wrap(
      new Promise((resolve, reject) => {
        const checkModelUpload = () => {
          cy.getMLCommonsTask(taskId).then(({ model_id: modelId, error }) => {
            if (error) {
              reject(new Error(error));
              return;
            }
            if (!!modelId) {
              resolve(modelId);
              return;
            }
            cy.wait(1000);
            checkModelUpload();
          });
        };
        checkModelUpload();
      })
    )
  )
);

Cypress.Commands.add('uploadModelByUrl', (body) =>
  cy
    .request({
      method: 'POST',
      url: MLC_API.MODEL_UPLOAD,
      body,
    })
    .then(({ body }) => body)
);

Cypress.Commands.add('deleteMLCommonsModel', (modelId) =>
  cy.request('DELETE', `${MLC_API.MODEL_BASE}/${modelId}`)
);

Cypress.Commands.add('loadMLCommonsModel', (modelId) =>
  cy.request({
    method: 'POST',
    url: `${MLC_API.MODEL_BASE}/${modelId}/_load`,
  })
);

Cypress.Commands.add('unloadMLCommonsModel', (modelId) =>
  cy.request({
    method: 'POST',
    url: `${MLC_API.MODEL_BASE}/${modelId}/_unload`,
  })
);

Cypress.Commands.add('getMLCommonsTask', (taskId) => {
  return cy
    .request({
      method: 'GET',
      url: `${MLC_API.TASK_BASE}/${taskId}`,
    })
    .then(({ body }) => body);
});
