# Session 03: Container Registry

> **Objective:** Learn how a container registry stores, authenticates, and distributes a Docker image built in Session 02.

**Status:** Complete

## Core mental model

A container registry is a remote service for storing and distributing container images. It is needed because a local Docker image exists only on one machine; a registry lets other machines, CI systems, and deployment platforms retrieve the same image.

The Session 02 image began as local Docker state:

```text
learning-devops/docker-refresh:local
```

Session 03 published it to Azure Container Registry (ACR), making it remote registry state:

```text
depslearningdevopsacr.azurecr.io/learning-devops/docker-refresh:v1
```

## Registry, repository, image, tag, and digest

| Term | Meaning in this lab |
| --- | --- |
| Registry | A service that stores images, such as Docker Hub or Azure Container Registry. |
| Repository | A named image collection inside a registry: `learning-devops/docker-refresh`. |
| Image | The packaged application artifact built in Session 02. |
| Tag | A mutable, human-readable reference, such as `v1` or `latest`. |
| Digest | An immutable, content-addressed manifest identity. |

A fully qualified image reference has this shape:

```text
<registry>/<repository>:<tag>
```

For this lab:

```text
depslearningdevopsacr.azurecr.io/learning-devops/docker-refresh:v1
```

The pushed manifest digest was:

```text
sha256:28d8cc9732e49b4c8d64eecb8e5b3e82131285aa75f53078c1f43721038cb46b
```

Tags are mutable references: a later push can move `v1` or `latest` to different content. A digest identifies the exact pushed content, so it is the safer identity when immutability matters.

## Registry options and access control

Docker Hub provides public and private registries. Private registries, including Azure Container Registry, provide registry-specific access control and integrate with their platform.

Registry authentication proves *who* is making a request. Authorization determines *what* that authenticated identity can do, such as pull or push a repository. A successful `az acr login` established Docker client authentication for the ACR used in this lab; access still depends on the relevant Azure permissions.

## Lab record

The image was first tagged for the ACR. At that point, both local references pointed to the same local image ID:

```text
dac568e657df
```

```bash
docker tag \
  learning-devops/docker-refresh:local \
  depslearningdevopsacr.azurecr.io/learning-devops/docker-refresh:v1
```

Tagging adds a reference; it does not copy image layers to a registry. The remote transfer occurred on push:

```bash
az acr login --name depslearningdevopsacr

docker push \
  depslearningdevopsacr.azurecr.io/learning-devops/docker-refresh:v1
```

ACR then confirmed that the remote repository existed:

```text
learning-devops/docker-refresh
```

```bash
az acr repository list \
  --name depslearningdevopsacr \
  --output table
```

## Portability proof

The portability test deleted the local image, pulled the fully qualified reference from ACR, and ran it again:

```bash
docker pull \
  depslearningdevopsacr.azurecr.io/learning-devops/docker-refresh:v1

docker run -d \
  --name registry-proof \
  -p 8080:3000 \
  depslearningdevopsacr.azurecr.io/learning-devops/docker-refresh:v1

curl localhost:8080
```

The runtime response was:

```text
Hello, from Docker Refresh!
```

This showed that the registry, rather than the original local image cache, supplied a runnable copy of the Session 02 application.

## Azure deployment note

The first ACR deployment attempt was rejected by the Azure for Students subscription's allowed-region policy. This was a governance constraint, not a Docker or CLI syntax problem.

The subscription allowed:

```text
eastasia
indonesiacentral
centralindia
malaysiawest
koreacentral
```

The ACR was subsequently created in `indonesiacentral` after checking the registry login server:

```bash
az acr show \
  --name depslearningdevopsacr \
  --query loginServer \
  --output table
```

This is a useful reminder that cloud configuration may be valid while still being rejected by organization or subscription policy.

## Key takeaways

- A registry makes an image available beyond the machine where it was built.
- Image tags provide convenient version labels, but they are mutable; digests identify exact immutable content.
- `docker tag` creates a local name, while `docker push` transfers the image to remote registry storage.
- `docker pull` retrieves a remote image into local Docker state.
- A private registry requires both authentication and authorization.
- A fully qualified image reference identifies the registry, repository, and tag required to retrieve an image.
- Removing local image state and successfully pulling and running it again is practical evidence of image portability.

## Cleanup

The temporary Azure resource group and Azure Container Registry were deliberately deleted after the image repository and runtime portability were validated. This was intentional cloud-resource hygiene to avoid unnecessary cost, not a failed deployment or missing lab result.
