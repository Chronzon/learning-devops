# Session 05 — Secure CI Image Publishing

## Status

**Completed ✅**

This session extended the previous CI workflow so that a Docker image built on an ephemeral GitHub Actions runner could be securely published to Azure Container Registry (ACR) and reused outside the runner.

No deployment to VM, AKS, Kubernetes, or production was performed.

## Final Flow

```text
Pull Request
    ↓
GitHub Actions Runner
    ↓
Node.js Validation
    ↓
Docker Build
    ↓
GitHub OIDC
    ↓
Azure Managed Identity
    ↓
ACR Authentication
    ↓
Commit SHA Tag
    ↓
Docker Push
    ↓
Azure Container Registry
    ↓
Registry Verification
```

## Why a Registry Is Needed

A Docker image built inside a GitHub-hosted runner exists only on that temporary runner.

```text
CI Runner
    ↓
Docker Image
    ↓
Runner Deleted
    ↓
Local Image Lost
```

Publishing the image to a container registry makes it persistent and distributable:

```text
CI Runner
    ↓
Docker Push
    ↓
Container Registry
    ↓
Image remains available after the runner disappears
```

## Azure Resources

The lab used:

```text
Resource Group:
rg-learning-devops-session05

Azure Container Registry:
depslearningdevopsacr.azurecr.io

SKU:
Basic

Region:
Indonesia Central
```

The ACR admin user remained disabled.

## Secure Authentication with OIDC

Instead of storing a long-lived Azure or ACR password in GitHub, the workflow authenticated using GitHub OIDC and an Azure User-Assigned Managed Identity.

```text
GitHub Actions
    ↓
OIDC Token
    ↓
Federated Credential
    ↓
Azure Managed Identity
    ↓
Temporary Azure Access
```

The managed identity was granted the `AcrPush` role only at the ACR scope.

This demonstrated:

- **Authentication** — proving which identity the workflow uses.
- **Authorization** — defining what that identity may do.
- **Least privilege** — granting only the access required for image publishing.

## GitHub Actions Permissions

The workflow required:

```yaml
permissions:
  id-token: write
  contents: read
```

`id-token: write` allows the GitHub Actions job to request an OIDC identity token.

## Image Traceability

The Docker image was tagged using the Git commit SHA:

```text
depslearningdevopsacr.azurecr.io/learning-devops/ci-fundamentals:<commit-sha>
```

Published tag:

```text
610bc07b93af0cd64f617f5718c4ba67cb129fda
```

This makes it possible to trace the container image back to the source revision that produced it.

## Registry Verification

The published repository was verified from Azure:

```text
learning-devops/ci-fundamentals
```

The commit SHA tag was also confirmed in ACR.

The registry manifest digest was:

```text
sha256:eb2cbc32ecc9fc605e6edd683adb1611755b8028f2a5dd7a388973f0d151950c
```

The commit SHA tag provides source traceability, while the digest identifies the exact registry artifact.

## Portability Proof

After the GitHub Actions runner had finished, the image was successfully pulled from ACR onto the local machine.

```bash
docker pull \
  depslearningdevopsacr.azurecr.io/learning-devops/ci-fundamentals:610bc07b93af0cd64f617f5718c4ba67cb129fda
```

The image was then executed locally with:

```bash
docker run --rm \
  depslearningdevopsacr.azurecr.io/learning-devops/ci-fundamentals:610bc07b93af0cd64f617f5718c4ba67cb129fda
```

Result:

```text
All tests passed
```

This proved that the image survived independently of the temporary CI runner.

The image was built as `linux/amd64`, while the local host was ARM64, so Docker reported a platform mismatch warning and used compatibility/emulation support.

## Meaningful Failures and Debugging

### Entra App Registration Permission

Creating an Entra application failed with:

```text
Insufficient privileges to complete the operation
```

The student tenant allowed Azure resource creation but did not allow the user to register Entra applications.

The lab therefore used a User-Assigned Managed Identity instead.

### Federated Subject Mismatch

The first OIDC login failed because Azure trusted:

```text
repo:Chronzon/learning-devops:pull_request
```

while GitHub presented an immutable subject containing owner and repository IDs.

The federated credential was updated to match the exact GitHub OIDC subject.

### Incorrect Subscription ID

OIDC authentication later failed because `AZURE_SUBSCRIPTION_ID` had the wrong value.

The value was corrected to the actual Azure subscription GUID.

After the correction:

```text
Azure CLI login succeeds by using OIDC.
```

## Key Takeaways

- CI runner storage is temporary.
- Container registries persist and distribute container images.
- Secrets should not be hardcoded into workflow files.
- OIDC avoids storing long-lived Azure credentials in GitHub.
- Identity, federation, role, and scope solve different security problems.
- Least privilege reduces the blast radius of compromised automation.
- Successful login proves authentication; successful push proves authorization.
- Mutable tags such as `latest` are poor identifiers for source traceability.
- Git commit SHA tags connect container artifacts to source revisions.
- Registry digests identify exact image content.
- A validated image can be built once and reused outside the CI environment.
- Publishing an image is not the same as deploying it.

## Result

**Session 05 — Secure CI Image Publishing completed successfully ✅**

The session stopped after secure image publishing, verification, and local portability testing. No deployment target was used.
