# Session 08 — Kubernetes Configuration, Health & Debugging

This session extends the existing Node.js application from the previous Kubernetes session and focuses on configuration, health checks, resource management, and structured debugging.

## What Was Practiced

* ConfigMap for non-sensitive configuration.
* Secret for sensitive configuration.
* `configMapKeyRef` and `secretKeyRef` environment injection.
* Readiness and liveness probes.
* Kubernetes resource requests and limits.
* Scheduler behavior when resource requests cannot fit a node.
* Debugging with `get`, `describe`, `logs`, `exec`, and events.
* Service and EndpointSlice behavior when Pods are not Ready.

## ConfigMap and Secret

The application reads `APP_ENV` from a ConfigMap and a dummy API token from a Secret.

```text
ConfigMap
→ non-sensitive configuration

Secret
→ sensitive configuration
```

Kubernetes Secret values may be stored as Base64-encoded data. Base64 is encoding, not encryption.

The Pod must explicitly reference the desired ConfigMap or Secret key.

## Readiness vs Liveness

Readiness answers:

```text
"Can this Pod receive normal traffic?"
```

A failed readiness probe can leave the container running while the Pod becomes `NotReady`; it does not itself restart the container. Services normally stop routing traffic to that backend.

Liveness answers:

```text
"Is the application still healthy enough to keep running?"
```

The kubelet checks liveness continuously, and repeated failures can restart the container.

Both probes continue running during the container lifetime; they are not limited to deployment startup.

## Running Does Not Mean Ready

A controlled experiment intentionally changed the readiness endpoint to an invalid path.

The new Pod became:

```text
Running
Ready: False
```

while an older Ready Pod continued serving traffic through the Service.

EndpointSlice showed both Ready and NotReady endpoints, while normal Service traffic continued using the Ready backend.

## Resource Requests and Limits

Final application resources:

```yaml
resources:
  requests:
    memory: "32Mi"
    cpu: "50m"
  limits:
    memory: "128Mi"
    cpu: "200m"
```

CPU units:

```text
1000m = 1 CPU
50m   = 0.05 CPU
200m  = 0.20 CPU
```

Requests are used by the scheduler when deciding whether a Pod can fit on a node.

Limits define runtime resource boundaries.

## Controlled Scheduling Failure

The local kind node had:

```text
Allocatable CPU: 8
```

A temporary Pod template requested:

```text
9 CPU
```

The Pod stayed `Pending` and Kubernetes reported:

```text
FailedScheduling
0/1 nodes are available: 1 Insufficient cpu
```

This demonstrated that a CPU request is a scheduling requirement, not immediate CPU consumption.

The final Deployment was restored to the normal `50m` CPU request and `200m` CPU limit.

## Debugging Workflow

A useful Kubernetes debugging order is:

```text
resource exists?
↓
scheduled?
↓
image available?
↓
container starts?
↓
application healthy?
↓
Pod Ready?
↓
Service has ready endpoints?
↓
network request works?
```

Useful commands:

```bash
kubectl get pods
kubectl describe pod <pod>
kubectl logs <pod>
kubectl logs <pod> --previous
kubectl exec <pod> -- printenv APP_ENV
kubectl get events --sort-by=.lastTimestamp
```

Mental model:

```text
kubectl get
→ What is the current state?

kubectl describe
→ Why does Kubernetes report that state?

kubectl logs
→ What is the application/container reporting?

kubectl exec
→ What can be inspected from inside the running container?

kubectl get events
→ What happened across the cluster?
```

Stop at the first failing layer before debugging higher layers.

## Service Debugging

When Pods are healthy but Service traffic fails, inspect:

```text
Service exists?
↓
selector matches Pod labels?
↓
EndpointSlice has Ready endpoints?
↓
port / targetPort correct?
```

Useful commands:

```bash
kubectl get svc
kubectl describe service learning-devops
kubectl get endpointslices
```

## Important Lab Observations

* `initDelaySeconds` is invalid; the correct field is `initialDelaySeconds`.
* Aggressive liveness probing caused temporary probe failures and container restarts during testing.
* Readiness failure alone does not restart a container.
* Liveness failures can trigger container restarts.
* A Pod may be `Running` while still being `NotReady`.
* A Pod that cannot be scheduled has no running container yet, so application logs are not the correct first debugging step.
* Changing `Deployment.spec.template` creates a rollout.
* Restoring a previously used Pod template can allow the Deployment to reuse the matching older ReplicaSet.

## Final State

The final Deployment returned to a healthy state:

```text
3 desired Pods
3 current Pods
3 Ready Pods
successful rollout
```

The workload continues using:

* ConfigMap-backed application configuration.
* Secret-backed dummy token configuration.
* readiness and liveness probes.
* CPU and memory requests/limits.
* ClusterIP Service routing to Ready Pods.
