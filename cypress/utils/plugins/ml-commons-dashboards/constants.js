/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../base_constants';

/**
 *****************************
 URL CONSTANTS
 *****************************
 */

const BASE_MLC_PATH = BASE_PATH + '/app/mlCommonsPlugin';

export const MLC_URL = {
  ROOT: BASE_MLC_PATH + '/',
  MONITORING: BASE_AD_PATH + '/monitoring',
};

export const MLC_FIXTURE_BASE_PATH = 'plugins/ml-commons-dashboards/';

export const MLC_API_PREFIX = '/_plugins/_ml';
export const MLC_APP_API_BASE = '/api/ml-commons';

export const MLC_API = {
  MODEL_BASE: `${MLC_API_PREFIX}/models`,
  TRAIN_BASE: `${MLC_API_PREFIX}/_train`,
  TASK_BASE: `${MLC_API_PREFIX}/tasks`,
};

export const MLC_APP_API = {
  MODEL: `${MLC_APP_API_BASE}/model`,
  MODEL_ALGORITHM: `${MLC_APP_API_BASE}/model-algorithm`,
};
