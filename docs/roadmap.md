# DevOps Learning Roadmap

This roadmap is intentionally outcome-focused. A topic is complete when I can apply it in a small, documented project—not when I have only read about it.

## 1. Foundations

- Linux processes, permissions, services, and shell scripting
- Networking: DNS, HTTP/HTTPS, TCP, ports, load balancing, and TLS
- Git workflows and release versioning

**Outcome:** Diagnose a simple application and package a repeatable local workflow.

## 2. Containers

- Build efficient Docker images
- Run multi-service applications with Docker Compose
- Manage environment variables, volumes, networks, and image registries

**Outcome:** Containerize an application and run it locally with its dependencies.

## 3. Kubernetes Refresh

- Revisit core workload, networking, configuration, and storage resources
- Practice debugging and deployment strategies
- Understand resource requests, limits, health checks, and security basics

**Outcome:** Deploy, expose, update, and troubleshoot a small application on Kubernetes.

## 4. CI/CD

- Automated linting, tests, image builds, and artifact publishing
- Deployment pipelines with safe environment separation
- Secrets handling and rollback strategy

**Outcome:** Push a change that is tested, packaged, and deployed through CI/CD.

## 5. Infrastructure as Code

- Terraform fundamentals, state, modules, and environment management
- Cloud networking and identity basics

**Outcome:** Provision and safely change a small cloud environment from version-controlled code.

## 6. Observability and Reliability

- Structured logs, metrics, traces, and alerting
- Service-level indicators, error budgets, and incident response

**Outcome:** Observe a deployed service and investigate a simulated failure.

## 7. Capstone

Combine the earlier outcomes into one small service: infrastructure provisioned with code, application containerized and deployed automatically, and basic monitoring in place.
