/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { MLC_URL, MLC_DASHBOARD_API } from '../../../utils/constants';

if (Cypress.env('ML_COMMONS_DASHBOARDS_ENABLED')) {
  describe('MLC Overview page', () => {
    it('should return to monitoring page when visit root', () => {
      cy.visit(MLC_URL.ROOT);
      cy.url().should('include', MLC_URL.OVERVIEW);
    });

    describe('custom upload model', () => {
      let uploadedModelId;
      let uploadedModelLoadedError;
      const uploadModelName = `traced_small_model-${new Date()
        .getTime()
        .toString(34)}`;
      before(() => {
        // Disable only_run_on_ml_node to avoid model upload error in case of cluster no ml nodes
        cy.disableOnlyRunOnMLNode();
        cy.disableNativeMemoryCircuitBreaker();
        cy.enableRegisterModelViaURL();
        cy.wait(1000);

        cy.registerModelGroup({
          name: 'model-group',
        })
          .then(({ model_group_id }) =>
            cy.uploadModelByUrl({
              name: uploadModelName,
              version: '1.0.0',
              model_format: 'TORCH_SCRIPT',
              model_task_type: 'text_embedding',
              model_group_id,
              model_content_hash_value:
                'e13b74006290a9d0f58c1376f9629d4ebc05a0f9385f40db837452b167ae9021',
              model_config: {
                model_type: 'bert',
                embedding_dimension: 768,
                framework_type: 'sentence_transformers',
                all_config:
                  '{"architectures":["BertModel"],"max_position_embeddings":512,"model_type":"bert","num_attention_heads":12,"num_hidden_layers":6}',
              },
              url: 'https://github.com/opensearch-project/ml-commons/blob/2.x/ml-algorithms/src/test/resources/org/opensearch/ml/engine/algorithms/text_embedding/traced_small_model.zip?raw=true',
            })
          )
          .then(({ task_id: taskId }) =>
            cy.cyclingCheckTask({
              taskId,
            })
          )
          .then(({ model_id: modelId }) => {
            uploadedModelId = modelId;
            return cy.loadMLCommonsModel(modelId);
          })
          .then(({ task_id: taskId }) =>
            cy.cyclingCheckTask({
              taskId,
              rejectOnError: false,
            })
          )
          .then(({ error }) => {
            if (error) {
              uploadedModelLoadedError = error;
            }
          });
      });

      after(() => {
        if (uploadedModelId) {
          cy.unloadMLCommonsModel(uploadedModelId);
          cy.deleteMLCommonsModel(uploadedModelId);
        }
      });

      it('should display page header and deployed model name, status and id', () => {
        cy.visit(MLC_URL.OVERVIEW);

        cy.contains('h1', 'Overview');
        cy.contains('h2', 'Deployed models');

        cy.get('[aria-label="Search by name or ID"]').type(uploadModelName);

        cy.contains(uploadedModelId)
          .closest('tr')
          .contains(uploadedModelLoadedError ? 'Not responding' : 'Responding')
          .closest('tr')
          .contains(uploadModelName);

        cy.contains('h1', 'Overview');
        cy.contains('h2', 'Deployed models');
      });

      it('should open preview panel after view detail button click', () => {
        cy.visit(MLC_URL.OVERVIEW);

        cy.get('[aria-label="Search by name or ID"]').type(uploadModelName);

        cy.contains(uploadedModelId)
          .closest('tr')
          .find('[aria-label="view detail"]')
          .click();

        cy.contains('.euiFlyoutHeader > h3', uploadModelName);
        cy.contains('.euiFlyoutBody', uploadedModelId);
      });

      it('should show empty nodes when deployed model profiling loading', () => {
        cy.intercept(
          'GET',
          MLC_DASHBOARD_API.DEPLOYED_MODEL_PROFILE.replace(
            ':modelID',
            uploadedModelId
          ),
          (req) => {
            req.on('response', (res) => {
              res.setDelay(3000);
            });
          }
        ).as('getDeployedModelProfile');

        cy.visit(MLC_URL.OVERVIEW);

        cy.get('[aria-label="Search by name or ID"]').type(uploadModelName);

        cy.contains(uploadedModelId)
          .closest('tr')
          .find('[aria-label="view detail"]')
          .click();

        cy.get('div[role="dialog"] .ml-nodesTableNodeIdCellText', {
          timeout: 0,
        }).should('not.exist');
        cy.wait('@getDeployedModelProfile');
        cy.get('div[role="dialog"] .ml-nodesTableNodeIdCellText').should(
          'exist'
        );
      });
    });

    describe('remote model', () => {
      let registeredConnectorId;
      let registeredRemoteModelId;
      before(() => {
        cy.disableConnectorAccessControl();
        cy.setEncryptionMasterKey('0000000000000001');
        cy.setTrustedConnectorEndpointsRegex([
          '^https://runtime\\.sagemaker\\..*\\.amazonaws\\.com/.*$',
          '^https://api\\.openai\\.com/.*$',
          '^https://api\\.cohere\\.ai/.*$',
          '^https://bedrock\\..*\\.amazonaws.com/.*$',
        ]);
        cy.wait(1000);
        cy.createModelConnector({
          name: 'SageMaker huggingface text-embedding Connector',
          description:
            'The connector to sageMaker service for a text embedding model with huggingface',
          version: 1,
          protocol: 'aws_sigv4',
          credential: {
            access_key: 'foo',
            secret_key: 'bar',
          },
          parameters: {
            region: 'ap-northeast-1',
            service_name: 'sagemaker',
          },
          actions: [
            {
              action_type: 'predict',
              method: 'POST',
              url: 'https://runtime.sagemaker.ap-northeast-1.amazonaws.com/endpoints/pytorch-inference-2023-07-11-07-52-20-256/invocations',
              headers: {
                'content-type': 'application/json',
              },
              request_body: '{"inputs": [${parameters.inputs}]}',
            },
          ],
        }).as('createConnectResult');
        cy.registerModelGroup({
          name: 'remote-model-group',
        }).as('registerModelGroupResult');
        cy.get('@createConnectResult')
          .then((createConnectResult) =>
            cy
              .get('@registerModelGroupResult')
              .then((registerModelGroupResult) => [
                createConnectResult.connector_id,
                registerModelGroupResult.model_group_id,
              ])
          )
          .then(([connectorId, modelGroupId]) => {
            registeredConnectorId = connectorId;
            console.log(connectorId, modelGroupId);
            return cy.registerModel({
              name: 'remote sega maker model',
              function_name: 'remote',
              model_group_id: modelGroupId,
              version: '1.0.0',
              description: 'test model',
              connector_id: connectorId,
            });
          })
          .then(({ task_id: taskId }) =>
            cy.cyclingCheckTask({
              taskId,
            })
          )
          .then(({ model_id: modelId }) => {
            registeredRemoteModelId = modelId;
            return cy.loadMLCommonsModel(modelId);
          })
          .then(({ task_id: taskId }) =>
            cy.cyclingCheckTask({
              taskId,
              rejectOnError: false,
            })
          );
      });
      after(() => {
        if (registeredRemoteModelId) {
          cy.unloadMLCommonsModel(registeredRemoteModelId);
          cy.deleteMLCommonsModel(registeredRemoteModelId);
          cy.wait(1000);
        }
        if (registeredConnectorId) {
          cy.deleteModelConnector(registeredConnectorId);
        }
      });
      it('should not show remote models', () => {
        cy.visit(MLC_URL.OVERVIEW);

        cy.get('[aria-label="Search by name or ID"]').type(
          registeredRemoteModelId
        );

        cy.contains(
          'There are no results to your search. Reset the search criteria to view the deployed models.'
        );
      });
    });
  });
}
