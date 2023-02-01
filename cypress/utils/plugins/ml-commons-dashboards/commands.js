import { MLC_API } from './constants';

Cypress.Commands.add(
  'uploadModelByUrl',
  (body, { maxRetries, checkGap } = { maxRetries: 100, checkGap: 2000 }) =>
    cy
      .request({
        method: 'POST',
        url: MLC_API.MODEL_UPLOAD,
        body: {
          name: 'all-MiniLM-L6-v1',
          version: '1.0.0',
          description: 'test model',
          model_format: 'TORCH_SCRIPT',
          model_config: {
            model_type: 'bert',
            embedding_dimension: 384,
            framework_type: 'sentence_transformers',
            all_config:
              '{"_name_or_path":"nreimers/MiniLM-L6-H384-uncased","architectures":["BertModel"],"attention_probs_dropout_prob":0.1,"gradient_checkpointing":false,"hidden_act":"gelu","hidden_dropout_prob":0.1,"hidden_size":384,"initializer_range":0.02,"intermediate_size":1536,"layer_norm_eps":1e-12,"max_position_embeddings":512,"model_type":"bert","num_attention_heads":12,"num_hidden_layers":6,"pad_token_id":0,"position_embedding_type":"absolute","transformers_version":"4.8.2","type_vocab_size":2,"use_cache":true,"vocab_size":30522}',
          },
          url: 'https://github.com/ylwu-amzn/ml-commons/blob/2.x_custom_m_helper/ml-algorithms/src/test/resources/org/opensearch/ml/engine/algorithms/text_embedding/all-MiniLM-L6-v2_torchscript_sentence-transformer.zip?raw=true',
          ...body,
        },
      })
      .then(({ body: { task_id: taskId } }) =>
        cy.getMLCommonsTask(taskId).then(({ model_id: modelId, error }) => {
          if (error) {
            return Promise.reject(`Failed to create upload task: ${error}`);
          }
          return { taskId, modelId };
        })
      )
      .then(
        ({ taskId, modelId }) =>
          new Promise((resolve) => {
            let currentTimes = 0;
            const intervalId = setInterval(() => {
              if (currentTimes > maxRetries) {
                clearInterval(intervalId);
                resolve({
                  taskId,
                  modelId,
                  reason: `Failed to uploaded model after ${currentTimes} times check`,
                });
                return;
              }
              const { model_state: modelState } = cy.getMLCommonsModel(modelId);
              if (modelState !== 'UPLOADING') {
                clearInterval(intervalId);
                resolve({
                  taskId,
                  modelId,
                  modelState,
                });
                return;
              }
              currentTimes++;
            }, checkGap);
          })
      )
);
Cypress.Commands.add('getMLCommonsModel', (modelId) =>
  cy.request({
    method: 'GET',
    url: `${MLC_API.MODEL_BASE}/${modelId}`,
  })
);

Cypress.Commands.add('deleteMLCommonsModel', (modelId) =>
  cy.request('DELETE', `${MLC_API.MODEL_BASE}/${modelId}`)
);

Cypress.Commands.add('getMLCommonsTask', (taskId) =>
  cy
    .request({
      method: 'GET',
      url: `${MLC_API.TASK_BASE}/${taskId}`,
    })
    .then(({ body }) => (console.log(body), body))
);

Cypress.Commands.add('deleteMLCommonsTask', (taskId) =>
  cy.request({
    method: 'DELETE',
    url: `${MLC_API.TASK_BASE}/${taskId}`,
  })
);
