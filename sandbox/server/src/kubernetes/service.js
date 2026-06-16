import { k8sCoreApi } from "./config.js";

export const createService = async (sandboxId) => {

    const serviceManifest = {
        metadata: {
            name: `sandbox-service-${sandboxId}`,
            labels: {
                app: 'sandbox',
                sandboxId: sandboxId
            }
        },
        spec: {
            selector: {
                app: 'sandbox-pod',
                sandboxId: sandboxId
            },
            ports: [
                {
                    port: 80,
                    targetPort: 'http'
                }
            ]
        },
        type: 'ClusterIP'
    };

    const response = await k8sCoreApi.createNamespacedService({
        namespace: 'default',
        body: serviceManifest
    });

    return response;
    
}