import { k8sCoreApi } from "./config.js";



export async function createPod(sandboxId) {

    const podManifest = {
        metadata: {
            name: `sandbox-pod-${sandboxId}`,
            labels: {
                app: "sandbox-pod",
                sandboxId: sandboxId
            }
        },
        spec: {
            volumes: [
                {
                    name: "workspace-volume",
                    emptyDir: {}
                }
            ],
            containers: [
                {
                    image: "template:1.0.2",
                    imagePullPolicy: "IfNotPresent",
                    name: "sandbox-container",
                    ports: [{ containerPort: 5173, name: "http" }],
                    resources: {
                        limits: { cpu: "500m", memory: "1Gi"},
                        requests: { cpu: "250m", memory: "500Mi"}
                    },
                    volumeMounts: [
                        {
                            name: "workspace-volume",
                            mountPath: "/workspace"
                        }
                    ]
                },{
                    image: "agent",
                    imagePullPolicy: "IfNotPresent",
                    name: "agent-container",
                    ports: [{ containerPort: 3000, name: "http" }],
                    resources: {
                        limits: { cpu: "500m", memory: "1Gi"},
                        requests: { cpu: "250m", memory: "500Mi"}
                    },
                    volumeMounts: [
                        {
                            name: "workspace-volume",
                            mountPath: "/workspace"
                        }
                    ]
                }
            ]
        }
    }

    const response = await k8sCoreApi.createNamespacedPod({
        namespace: 'default',
        body: podManifest
    })

    return response;
    
}