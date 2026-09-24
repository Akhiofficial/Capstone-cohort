import { k8sCoreApi } from "./config.js";



export async function createPod(sandboxId, projectId) {

    const podManifest = {
        metadata: {
            name: `sandbox-pod-${sandboxId}`,
            labels: {
                app: 'sandbox-pod',
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
            initContainers: [
                {
                    name: "init-container",
                    image: "template",
                    imagePullPolicy: "IfNotPresent",
                    command: ["sh", "-c", "cp -a /workspace/. /seed/"],
                    volumeMounts: [
                        {
                            name: "workspace-volume",
                            mountPath: "/seed"
                        }
                    ]
                }
            ],
            containers: [
                {
                    image: "template:latest",
                    imagePullPolicy: "IfNotPresent",
                    name: "sandbox-container",
                    ports: [{ containerPort: 5173, name: "http" }],
                    resources: {
                        limits: { cpu: "500m", memory: "1Gi" },
                        requests: { cpu: "250m", memory: "500Mi" }
                    },
                    volumeMounts: [
                        {
                            name: "workspace-volume",
                            mountPath: "/workspace"
                        }
                    ]
                }, {
                    image: "agent:latest",
                    imagePullPolicy: "IfNotPresent",
                    name: "agent-container",
                    ports: [{ containerPort: 3000, name: "agent-http" }],
                    resources: {
                        limits: { cpu: "500m", memory: "1Gi" },
                        requests: { cpu: "250m", memory: "500Mi" }
                    },
                    volumeMounts: [
                        {
                            name: "workspace-volume",
                            mountPath: "/workspace"
                        }
                    ]
                }, {
                    image: "sync-agent",
                    imagePullPolicy: "IfNotPresent",
                    name: "sync-agent-container",
                    env: [
                        { name: "PROJECT_ID", value: projectId },
                        { name: "LOCAL_DIRECTORY", value: "/workspace" },
                        {
                            name: "S3_BUCKET",
                            valueFrom: {
                                secretKeyRef: {
                                    name: "aws",
                                    key: "S3_BUCKET"
                                }
                            }
                        },
                        {
                            name: "AWS_REGION",
                            valueFrom: {
                                secretKeyRef: {
                                    name: "aws",
                                    key: "AWS_REGION"
                                }
                            }
                        },
                        {
                            name: "AWS_ACCESS_KEY_ID",
                            valueFrom: {
                                secretKeyRef: {
                                    name: "aws",
                                    key: "AWS_ACCESS_KEY_ID"
                                }
                            }
                        },
                        {
                            name: "AWS_SECRET_ACCESS_KEY",
                            valueFrom: {
                                secretKeyRef: {
                                    name: "aws",
                                    key: "AWS_SECRET_ACCESS_KEY"
                                }
                            }
                        }
                    ],
                    resources: {
                        limits: { cpu: "250m", memory: "256Mi" },
                        requests: { cpu: "100m", memory: "128Mi" }
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

export async function deletePod(sandboxId) {

    const response = await k8sCoreApi.deleteNamespacedPod({
        namespace: 'default',
        name: `sandbox-pod-${sandboxId}`
    }, {
        gracePeriodSeconds: 0,
    })

    return response;
}
