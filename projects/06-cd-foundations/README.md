# Session 06 — CD Foundations

## Goal

Learn the boundary between CI and CD by deploying a previously validated container artifact to a non-production environment without rebuilding it.

## Architecture

```text
Pull Request
    ↓
CI
    ↓
Validate container
    ↓
Build once
    ↓
Push validated image to ACR
    ↓
──────── CI ends ────────

Manual workflow trigger
    ↓
GitHub OIDC
    ↓
CD identity
    ↓
Azure Container Apps (staging)
    ↓
Runtime identity pulls from ACR
    ↓
Smoke test
    ↓
STOP
```

## Application

The session uses a small Node.js HTTP service with:

- `/` — returns the application name and runtime environment.
- `/health` — returns a basic health response.
- `APP_ENV` — runtime configuration injected outside the container image.

The same container image was verified locally with different runtime values such as `local`, `ci`, and `staging`.

## Identity Separation

Three Azure managed identities were used with separate responsibilities:

- **CI identity** — `AcrPush` on the session ACR.
- **CD identity** — permission to manage the staging Container App.
- **Runtime identity** — `AcrPull` on the session ACR.

GitHub Actions authenticates to the CI and CD identities through OIDC federation. The Container App uses its managed identity natively inside Azure.

## Validated Artifact

Repository:

```text
depslearningdevopsacr06.azurecr.io/learning-devops/session-06
```

Validated image tag:

```text
29fd36c79d71cd8cbed6d223e45f0e455bfabd63
```

Registry digest:

```text
sha256:56cb6598a1d4abb3b9417e397140322caab754358c76b34b97bae2a9f0fbe04d
```

The image validated by CI was the same artifact later deployed to staging.

## CD Flow

A manual staging deployment was performed first to understand the deployment mechanics. The controlled staging workflow then uses `workflow_dispatch` and requires an explicit image tag.

The workflow:

1. Authenticates to Azure using the CD managed identity and OIDC.
2. Updates the staging Azure Container App with the selected image.
3. Retrieves the staging endpoint.
4. Runs smoke tests against `/` and `/health`.
5. Stops after non-production verification.

No production deployment is performed in this session.

## Verification

The staging deployment returned:

```text
Learning DevOps - Session 06
Environment: staging
```

Health verification returned:

```json
{"status":"ok"}
```

The Container App reported a healthy and provisioned revision.

Revisions represent changed Container App templates. Re-deploying the same image and runtime configuration leaves the desired template unchanged, so it does not create another revision. A rollback would select a known-good artifact and revision rather than rebuild an older image.

## Debugging Notes

- The local Container Apps CLI did not support `--environment-mode ConsumptionOnly`. The supported equivalent was `--enable-workload-profiles false`.
- The subscription was not registered for `Microsoft.OperationalInsights`. Registering the resource provider resolved Container Apps environment creation.
- A CD-only pull request triggered the application CI workflow and published an unnecessary second image. CI path filtering was added during closeout.
- Re-deploying the same image and runtime configuration did not create another Container Apps revision because the desired template did not change.

## Key Lessons

- CI produces a trusted deployable artifact; CD moves that artifact into a runtime environment.
- Build once and promote the exact validated artifact instead of rebuilding during deployment.
- Application artifacts and environment-specific configuration should remain separate.
- Manual deployment triggers and approval gates solve different control problems.
- Successful provisioning is not sufficient; deployments should be verified with smoke tests.
- Commit tags improve source traceability, while image digests identify exact registry artifacts.
- Rollback means returning to a known-good artifact, not rebuilding an older version.
- Least privilege is easier to reason about when CI, CD, and runtime identities have separate responsibilities.
