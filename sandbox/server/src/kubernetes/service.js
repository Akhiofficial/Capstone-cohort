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

export async function deleteService(sandboxId) {
    try {
        const response = await k8sCoreApi.deleteNamespacedService({
            namespace: 'default',
            name: `sandbox-service-${sandboxId}`
        });
        return response;
    } catch (error) {
        const code = error?.statusCode ?? error?.response?.statusCode ?? error?.body?.code;
        if (code === 404) return null; // already deleted by another replica
        throw error;
    }
}