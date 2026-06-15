import * as K8sApi from '@kubernetes/client-node'

const kc = new K8sApi.KubeConfig();
kc.loadFromDefault();

export const k8sCoreApi = kc.makeApiClient(K8sApi.CoreV1Api);

