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
                    name: "http",
                    port: 80,
                    targetPort: parseInt(5173),
                    protocol: "TCP"
                }, {
                    name: "agent-http",
                    port: 3000,
                    targetPort: parseInt(3000),
                    protocol: "TCP"
                }
            ],
            type: 'ClusterIP'
        }
    };

    const response = await k8sCoreApi.createNamespacedService({
        namespace: 'default',
        body: serviceManifest
    });

    return response;

}