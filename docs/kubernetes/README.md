# Kubernetes Refresh

These notes refresh the concepts I need to deploy and operate a small application.

## Mental model

Kubernetes reconciles declared state with actual state. I describe the desired resources in manifests; controllers work to make the cluster match them.

## Core resources

| Resource | Responsibility |
| --- | --- |
| Pod | Runs one or more tightly coupled containers. |
| Deployment | Maintains stateless Pods and supports rolling updates. |
| Service | Provides a stable network endpoint for a set of Pods. |
| Ingress | Routes external HTTP(S) traffic to Services. |
| ConfigMap | Stores non-sensitive configuration. |
| Secret | Stores sensitive configuration; access must still be controlled. |
| Namespace | Scopes resources and policies within a cluster. |

## Deployment checklist

1. Create a `Deployment` with an explicit container image and labels.
2. Add readiness and liveness probes appropriate to the application.
3. Set CPU and memory requests and limits based on measured needs.
4. Expose the workload through a `Service`.
5. Add configuration through `ConfigMap` or `Secret`, not baked into the image.
6. Verify rollout health, logs, events, and endpoint availability.

## Useful commands

```bash
kubectl get pods -A
kubectl get deployments,services -n <namespace>
kubectl describe pod <pod-name> -n <namespace>
kubectl logs <pod-name> -n <namespace> --all-containers
kubectl rollout status deployment/<deployment-name> -n <namespace>
kubectl get events -n <namespace> --sort-by=.lastTimestamp
```

## Next practice

Deploy a small HTTP service locally, expose it with a Service, introduce a failed rollout, and use the commands above to diagnose and recover it.
