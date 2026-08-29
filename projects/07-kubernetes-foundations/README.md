# Session 07 — Kubernetes Foundations

## Goal

Map the container and deployment concepts from previous sessions into Kubernetes using a local `kind` cluster.

This session intentionally reuses the Node.js application from Session 06. The application was not replaced because the learning focus is Kubernetes orchestration rather than application development.

## Core Flow

```text
Existing Node.js App
        ↓
Docker Image
        ↓
kind Local Cluster
        ↓
Deployment
        ↓
ReplicaSet
        ↓
Pods
        ↓
ClusterIP Service
        ↓
Local Verification
```

## Project Structure

```text
07-kubernetes-foundations/
├── app/
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
├── k8s/
│   ├── deployment.yaml
│   └── service.yaml
└── README.md
```

## Kubernetes Mental Model

```text
Deployment
    ↓
ReplicaSet
    ↓
Pods
    ↓
Containers
```

Kubernetes works around **desired state**.

For example:

```text
desired replicas = 3
actual replicas  = 2

        ↓

controller reconciliation

        ↓

actual replicas = 3
```

A Pod is disposable. Kubernetes cares about maintaining the desired workload rather than preserving one specific Pod identity.

## Local Cluster with kind

`kind` runs Kubernetes nodes as Docker containers.

```text
Mac
├── kubectl
└── Docker
    └── learning-devops-control-plane
        └── Kubernetes
```

The same object can therefore appear as:

```text
docker ps
→ Docker container

kubectl get nodes
→ Kubernetes Node
```

## Local Image Flow

The application image was built and verified locally before being loaded into the kind node.

```text
docker build
    ↓
local Docker image
    ↓
Docker verification
    ↓
kind load docker-image
    ↓
kind node container runtime
    ↓
Pod
```

A Docker image available on the host is not automatically available inside the Kubernetes node runtime.

The node runtime was inspected with:

```bash
docker exec learning-devops-control-plane crictl images
```

## Deployment and Labels

The Deployment manages Pods using a stable label:

```yaml
app: learning-devops
```

The Deployment selector identifies which Pods belong to the workload, while the Pod template assigns the label to newly created Pods.

```text
Deployment selector
→ workload lifecycle relationship

Service selector
→ network relationship
```

## Service Networking

The application uses a `ClusterIP` Service.

```text
Service :80
    ↓
targetPort
    ↓
Pod :3000
```

Pod IPs are disposable, while the Service provides a stable networking abstraction.

`EndpointSlice` was used to inspect the actual Pod backends discovered by the Service.

Local verification used:

```bash
kubectl port-forward service/learning-devops 8080:80
```

```bash
curl localhost:8080
curl localhost:8080/health
```

## Self-Healing

With one replica, the running Pod was manually deleted.

Kubernetes detected:

```text
desired = 1
actual  = 0
```

and automatically created a replacement Pod.

The replacement received a different Pod IP, while the Service EndpointSlice automatically updated to the new backend.

## Scaling

The Deployment was changed declaratively from:

```yaml
replicas: 1
```

to:

```yaml
replicas: 3
```

The existing ReplicaSet scaled to three Pods.

The Service then discovered multiple Pod backends.

Deleting one Pod again caused Kubernetes to restore the desired replica count automatically.

> Three Pod replicas on one kind node do not provide node redundancy.

## Scaling vs Rolling Update

An important Deployment behavior observed in this session:

```text
Deployment.spec.replicas changes
→ scale the existing ReplicaSet

Deployment.spec.template changes
→ create a new ReplicaSet and perform a rollout
```

Examples:

```text
replicas: 3 → 4
= scaling
= same ReplicaSet

APP_ENV change
= Pod template change
= new ReplicaSet

container image change
= Pod template change
= new ReplicaSet
```

## Rolling Update

The runtime configuration was changed from:

```text
APP_ENV=kubernetes-local
```

to:

```text
APP_ENV=kubernetes-local-v2
```

Because the environment variable is part of `Deployment.spec.template`, Kubernetes created a new ReplicaSet and gradually replaced the old Pods.

Observed ReplicaSets:

```text
learning-devops-6ffc764775
→ old revision
→ desired replicas: 0

learning-devops-58d485c684
→ current revision
→ desired replicas: 3
```

The Service continued routing to Pods using the stable:

```text
app=learning-devops
```

label.

Final verification:

```text
Learning DevOps - Session 06
Environment: kubernetes-local-v2
```

```json
{"status":"ok"}
```

## Namespace, ConfigMap, and Secret

Namespaces were introduced as logical scopes inside a Kubernetes cluster.

ConfigMap and Secret were introduced conceptually:

```text
ConfigMap
→ non-sensitive configuration

Secret
→ sensitive configuration
```

They were intentionally not added to the application yet.

## Meaningful Debugging Notes

- `kubectl get pods` queries the current namespace, while `kubectl get pods -A` queries all namespaces.
- The typo `kubectl config get-contextx` produced an unknown-command error; `kubectl config -h` is the correct discovery approach.
- Host Docker images and Kubernetes node runtime images are separate boundaries.
- `kind load docker-image` makes a local image available to the kind node.
- Pod lifecycle watches may temporarily show `Pending`, `ContainerCreating`, `Terminating`, or `Error`; verify the final reconciled state.
- Pod replacement may change Pod IPs without requiring Service configuration changes.
- `kubectl port-forward` is intended for local development/debugging, not production exposure.

## Intentionally Deferred

The following topics are outside Session 07 scope:

```text
AKS
Helm
Ingress
Database
Persistence
```

They will be introduced only after the Kubernetes fundamentals are sufficiently established.
