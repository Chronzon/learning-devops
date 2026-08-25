# Session 4 — CI/CD Fundamentals

## Status

**Completed ✅**

This session focused on understanding the fundamentals of CI/CD and implementing a basic Continuous Integration workflow using GitHub Actions.

The lab ended with a CI pipeline that successfully:

- checked out the repository,
- configured Node.js 24,
- installed dependencies with `npm ci`,
- ran automated tests,
- ran build validation,
- built a Docker image,
- and stopped before registry push or deployment.

---

## 1. CI Mental Model

Before CI, validation was performed manually on the local machine:

```text
Source Code
    ↓
Local Machine
    ↓
Install Dependencies
    ↓
Test
    ↓
Build
```

With CI, the same validation is reproduced on an independent runner:

```text
Developer
    ↓
Git Push / Pull Request
    ↓
GitHub
    ↓
CI Runner
    ↓
Checkout
    ↓
Setup Runtime
    ↓
Install
    ↓
Test
    ↓
Build
```

The important idea is:

> CI verifies that the project can be reproduced and validated outside the developer's own machine.

A successful CI run increases confidence, but it does not automatically mean the application is production-ready.

---

## 2. Continuous Integration, Delivery, and Deployment

### Continuous Integration

Frequently integrating changes into a shared codebase and automatically validating those changes.

```text
Feature Branch
    ↓
Pull Request
    ↓
CI Validation
    ↓
Merge
```

### Continuous Delivery

The application is continuously kept in a deployable state, but production deployment still requires manual approval.

### Continuous Deployment

Validated changes are automatically deployed to production without a manual deployment gate.

Simple mental model:

```text
Integration = Is the change safe to merge?
Delivery    = Is the change ready to release?
Deployment  = Release it to the target environment.
```

---

## 3. Git Refresher for CI/CD

Basic local Git flow:

```text
Working Directory
    ↓ git add
Staging Area
    ↓ git commit
Local Repository
    ↓ git push
Remote Repository
```

Useful commands:

```bash
git status
git diff

git switch -c feature/example

git add .
git commit -m "message"

git push origin feature/example

git fetch origin
git pull
```

Important concepts:

- `origin` is a remote name, not a branch.
- A repository can have multiple remotes.
- `HEAD` represents the current position/active branch.
- Feature branches allow changes to be isolated from `main`.
- `origin/feature-x` is a remote-tracking reference.
- `git fetch` updates remote information without directly modifying the current branch.
- `git pull` fetches and integrates remote changes.

When `main` has moved while working on a feature branch:

```bash
git add .
git commit -m "WIP: save current progress"

git fetch origin
git merge origin/main
```

Then continue working on the feature branch.

---

## 4. Pull Requests and Merge Strategy

A Pull Request is a GitHub collaboration feature, not a Git command.

Typical flow:

```text
Feature Branch
    ↓
Commit
    ↓
Push
    ↓
Pull Request
    ↓
CI
    ↓
Merge
```

This session used **Squash and Merge** to keep `main` history clean.

After a squash merge, Git may not consider the original feature commits directly merged, so local branch cleanup may require:

```bash
git branch -D feature/example
```

after confirming the squashed changes are already present in `main`.

---

## 5. GitHub Actions Structure

The main GitHub Actions hierarchy used in this session:

```text
Trigger
  ↓
Workflow
  ↓
Job
  ↓
Runner
  ↓
Steps
```

The workflow is stored at:

```text
.github/workflows/ci.yml
```

This directory must exist at the **repository root**.

Core concepts:

- **Workflow** — the automation definition.
- **Trigger** — the event that starts the workflow.
- **Job** — a group of steps executed by a runner.
- **Runner** — the machine executing the job.
- **Step** — an individual action or shell command.

---

## 6. Basic CI Workflow

The final workflow used a GitHub-hosted Ubuntu runner.

```yaml
name: CI

on:
  pull_request:

jobs:
  validate:
    runs-on: ubuntu-latest

    defaults:
      run:
        working-directory: projects/04-ci-cd-fundamentals/app

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 24

      - run: npm ci
      - run: npm test
      - run: npm run build

      - name: Build Docker image
        run: docker build -t learning-devops/ci-fundamentals:ci .
```

---

## 7. Checkout and Runtime Setup

The runner does not automatically contain the repository source code.

```yaml
- uses: actions/checkout@v4
```

checks out the repository into the runner.

Node.js was configured explicitly:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 24
```

This makes the CI runtime predictable instead of relying on whatever Node version happens to exist on the runner.

---

## 8. `npm install` vs `npm ci`

Local development can use:

```bash
npm install
```

to create or update the lockfile.

CI uses:

```bash
npm ci
```

because it installs dependencies based strictly on `package-lock.json`.

The goal is reproducibility:

```text
Repository dependency state
        ↓
Same dependency installation in CI
```

CI should validate the committed project state, not silently modify dependency versions.

---

## 9. Static vs Dynamic Validation

Static validation analyzes source code without running the complete application behavior.

Examples include:

- linting,
- type checking,
- syntax checks,
- static analysis.

Dynamic validation executes code and checks actual behavior.

For the lab:

```bash
npm test
```

ran a simple Node.js test.

```bash
npm run build
```

used:

```bash
node --check math.js
```

as a simple syntax/build validation step for learning purposes.

Not every project needs a command named `lint`. Validation depends on the language and project stack.

---

## 10. Failure Propagation

Steps inside the same job execute sequentially.

If a required step fails:

```text
npm ci ✅
npm test ❌
npm run build ⛔ skipped
```

the job fails.

A CI failure is useful feedback because it identifies which validation gate is not satisfied.

---

## 11. Hands-On Node App

Project location:

```text
projects/04-ci-cd-fundamentals/app
```

Main files:

```text
Dockerfile
math.js
math.test.js
package.json
package-lock.json
```

The mini app used a simple function:

```js
function add(a, b) {
  return a + b;
}

module.exports = { add };
```

and a test using Node's built-in `assert`.

Local validation successfully passed:

```bash
npm ci
npm test
npm run build
```

---

## 12. First CI Failure and Fix

The first CI run failed because the workflow used the wrong working directory:

```text
04-ci-cd-fundamentals/app
```

The actual repository path was:

```text
projects/04-ci-cd-fundamentals/app
```

The runner reported:

```text
No such file or directory
```

The workflow was fixed to:

```yaml
working-directory: projects/04-ci-cd-fundamentals/app
```

After pushing the fix to the same feature branch:

```text
Existing Pull Request
    ↓
Branch Updated
    ↓
CI Automatically Reran
    ↓
PASS
```

This demonstrated the normal CI feedback loop:

```text
CI Fail
↓
Inspect Error
↓
Fix Locally
↓
Commit
↓
Push
↓
CI Rerun
```

---

## 13. Docker Build in CI

A Dockerfile was added to the lab:

```dockerfile
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

CMD ["node", "math.test.js"]
```

The image was first validated locally.

Then CI added:

```yaml
- name: Build Docker image
  run: docker build -t learning-devops/ci-fundamentals:ci .
```

The GitHub runner successfully:

```text
pulled node:24-alpine
↓
copied package files
↓
ran npm ci
↓
copied source code
↓
exported Docker image
```

The CI build successfully created:

```text
learning-devops/ci-fundamentals:ci
```

This image existed only on the CI runner.

It was **not pushed to Docker Hub or Azure Container Registry**.

---

## 14. Artifacts and Secrets

### Artifact

An artifact is an output created by a pipeline that should survive beyond the runner's lifetime.

Examples:

```text
build output
test reports
coverage reports
compiled binaries
```

Docker images are normally distributed through a container registry instead of being treated as generic CI artifacts.

### Secrets

Credentials must not be committed into Git.

CI platforms provide secret storage so sensitive values can be injected only when required at runtime.

Registry credentials were intentionally **not used in this session**.

---

## 15. Environment Boundaries

### Local Machine

Used for:

- development,
- local testing,
- Git operations.

### GitHub

Used for:

- source code,
- Git history,
- branches,
- Pull Requests,
- workflow definitions.

### CI Runner

Used for:

- checkout,
- runtime setup,
- dependency installation,
- tests,
- build validation,
- Docker image build.

### Container Registry

Used to persist and distribute container images.

### Deployment Target

Where the application actually runs, such as:

```text
VM
container platform
Kubernetes
server
```

CI runner and deployment target are different environments.

---

## 16. Final Session Flow

```text
Local Development
        ↓
Feature Branch
        ↓
Commit
        ↓
Push
        ↓
Pull Request
        ↓
GitHub Actions
        ↓
Node Validation
        ↓
Docker Build
        ↓
CI PASS
        ↓
Squash and Merge
        ↓
main
```

No registry push or production deployment was performed.

---

## Key Takeaways

- CI validates the project in an independent environment.
- GitHub Actions is a CI automation tool, not CI itself.
- CI success increases confidence but does not automatically mean production-ready.
- Pull Requests are useful pre-merge validation gates.
- Jobs run on runners, while steps execute sequentially inside a job.
- `npm ci` is preferred for reproducible CI dependency installation.
- Static validation and runtime testing solve different problems.
- CI failures are feedback.
- Workflow files must live under `.github/workflows/` at repository root.
- Docker images can be built and validated in CI without pushing them to a registry.
- Registry authentication and deployment are separate concerns.

---

## Result

**Session 4 — CI/CD Fundamentals completed successfully ✅**