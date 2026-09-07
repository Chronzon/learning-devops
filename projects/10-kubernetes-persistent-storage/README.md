# Session 10 — Kubernetes Persistent Storage & StatefulSets

## Overview

This session focused on Kubernetes persistent storage and stateful workloads using a local `kind` cluster.

The main goal was to understand the difference between ephemeral container storage and persistent storage, then apply those concepts with PVCs, PVs, StorageClasses, StatefulSets, and a headless Service.

## What Was Practiced

- Verified the default `StorageClass` using `rancher.io/local-path`
- Demonstrated that container-local data is ephemeral
- Created and consumed a `PersistentVolumeClaim`
- Observed dynamic PV provisioning with `WaitForFirstConsumer`
- Verified data persistence after Pod deletion and recreation
- Inspected PVC, PV, and StorageClass relationships
- Created a StatefulSet with `volumeClaimTemplates`
- Verified one PVC per StatefulSet replica
- Tested stable ordinal Pod identities
- Created a headless Service with `clusterIP: None`
- Verified stable per-Pod DNS
- Scaled the StatefulSet down and back up
- Deleted and recreated the StatefulSet while preserving its PVC data

## Key Concepts

### Ephemeral vs Persistent Storage

Data stored only inside a container filesystem disappears when the Pod is replaced.

Persistent storage uses:

```text
Pod -> PVC -> StorageClass -> PV
```

The application mounts the PVC, while Kubernetes and the storage provisioner handle the underlying volume.

The default `standard` StorageClass uses the `rancher.io/local-path` provisioner. Dynamic provisioning created a separate PV after a claim was consumed, following `WaitForFirstConsumer`. Its `Delete` reclaim policy describes what happens to a dynamically provisioned PV when its PVC is deleted.

### StatefulSet

Unlike Deployment replicas, StatefulSet replicas have stable identities:

```text
storage-demo-0
storage-demo-1
storage-demo-2
```

Each replica received its own persistent volume through `volumeClaimTemplates`.

### Headless Service

The StatefulSet used a headless Service:

```yaml
clusterIP: None
```

This allows stable DNS records for individual Pods instead of routing through a single Service virtual IP.

The Pod DNS names follow the StatefulSet ordinal, for example `storage-demo-0.storage-demo.session-10.svc.cluster.local`.

## Retention Proof

Scaling from three replicas down and back up retained the ordinal PVCs and their data. Deleting and recreating the StatefulSet also reused the existing PVCs, preserving the data for each ordinal.

## Final Verification

The final environment had:

- StatefulSet: `storage-demo` — `3/3` Ready
- Headless Service: `storage-demo`
- Three Bound PVCs
- Three dynamically provisioned PVs
- StorageClass: `standard`
- Provisioner: `rancher.io/local-path`
- Reclaim policy: `Delete`
- Volume binding mode: `WaitForFirstConsumer`

## Useful Commands

```bash
kubectl get all -n session-10
kubectl get pvc -n session-10
kubectl get pv
kubectl get storageclass

kubectl describe pvc <pvc-name> -n session-10
kubectl describe pv <pv-name>

kubectl scale statefulset storage-demo --replicas=3 -n session-10
kubectl get pods -n session-10 -w
```

## Closeout Boundary

No cluster cleanup is performed as part of this repository closeout. The local `kind` cluster and its resources remain under the learner's control.

## Result

Session 10 successfully demonstrated Kubernetes persistent storage fundamentals and the core behavior of StatefulSets, including stable identity, per-replica persistent volumes, stable DNS, and data retention across Pod and StatefulSet recreation.
