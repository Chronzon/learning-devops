# Session 09 — Kubernetes Networking & NetworkPolicy

This session focused on Kubernetes internal networking, Service discovery, and traffic control using NetworkPolicy.

**Environment:** the existing local `learning-devops` kind cluster, with kindnetd as its CNI.

## What Was Practiced

- CoreDNS and Kubernetes Service discovery
- Cross-namespace DNS using `<service>.<namespace>`
- Service ClusterIP vs Pod IPs and EndpointSlices
- Namespaces as logical scope, not automatic network isolation
- CNI / kindnetd NetworkPolicy enforcement
- `podSelector` and `namespaceSelector`
- Ingress vs egress traffic control
- Additive NetworkPolicy behavior
- Explicit DNS egress on TCP/UDP port 53
- Label-based access between Pods

## Mental Model

```text
metadata.namespace + podSelector
→ which Pods does this policy control?

Ingress
→ what traffic may enter those Pods?

Egress
→ what traffic may leave those Pods?
```

If both sides are isolated:

```text
source egress must allow
AND
destination ingress must allow
```

## DNS and Namespaces

A Service can be addressed with:

```text
backend.api
backend.api.svc.cluster.local
```

A short Service name such as `backend` is normally resolved relative to the caller's namespace.

Different namespaces do not automatically block communication.

## Final Traffic Model

```text
web/authorized-client
        │
        │ egress allowed
        ▼
api/backend
        ▲
        │ ingress allowed
```

The authorized client is identified with the label:

```text
access=backend
```

The backend is identified with:

```text
app=backend
```

The final policies allow:

- DNS from the authorized client to CoreDNS on TCP/UDP 53
- application traffic from the authorized client to the backend on TCP 3000
- backend ingress only from the authorized client identity

Other matching traffic remains restricted.

## Important Lessons

- CoreDNS resolves Service names; it does not forward HTTP traffic.
- A normal Service DNS record resolves to the Service ClusterIP.
- `podSelector` matches Pod labels.
- `namespaceSelector` matches labels on Namespace objects.
- `namespaceSelector` + `podSelector` in the same peer means both conditions must match.
- Peers in separate YAML list items are alternatives (OR); selectors in one peer are combined (AND).
- NetworkPolicies are additive.
- Deny-all plus separate allow policies were used during the lab to prove additive behavior, then consolidated into cleaner final policies.
- Egress isolation can also block DNS, so DNS may need to be explicitly allowed.
- Labels are more reliable than Pod names for workload identity.
- The NetworkPolicy API expresses the intended rules; actual enforcement depends on the installed CNI dataplane.

## Useful Commands

```bash
kubectl get networkpolicy -A
kubectl describe networkpolicy <name> -n <namespace>

kubectl describe service kube-dns -n kube-system
kubectl exec <pod> -- cat /etc/resolv.conf

kubectl get pods -n <namespace> --show-labels
kubectl get endpointslices -n <namespace>

kubectl api-resources | grep -i networkpol
kubectl explain networkpolicy.spec

nslookup backend.api.svc.cluster.local
wget -T 3 -qO- http://backend.api
```

## Final Manifests

```text
k8s/
├── authorized-client.yaml
├── unauthorized-client.yaml
├── backend-deployment.yaml
├── backend-service.yaml
├── backend-ingress.yaml
└── authorized-client-egress.yaml
```
