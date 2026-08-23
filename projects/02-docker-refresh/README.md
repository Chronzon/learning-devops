# Session 02: Docker Refresh

> **Objective:** Refresh Docker's process, image, storage, networking, and debugging models by building and operating a small Node.js HTTP service.

**Status:** Complete

## Core mental models

- A container is an isolated process environment, not a lightweight virtual machine.
- A container's lifecycle follows its main process (PID 1). When PID 1 exits, the container stops.
- `docker exec` starts an additional process inside an already-running container; its shell is not PID 1.
- An image is an immutable build artifact. A container is a runnable instance created from an image, and one image can create many containers.
- Container names must be unique while the named containers exist.

## Image and container lifecycle

This lab built a local Node Alpine image and ran it with host port publishing:

```bash
docker build -t docker-refresh:local .
docker run --name docker-refresh -p 3000:3000 docker-refresh:local
curl http://localhost:3000
```

The image remains reusable after a container is stopped or removed. The container's writable layer does not: data written only there disappears when that container is removed and recreated.

## Storage

| Storage type | Location and management | Persistence |
| --- | --- | --- |
| Container writable layer | Managed with the container | Removed with the container |
| Named volume | Docker-managed storage | Outlives containers that use it |
| Bind mount | A path on the host filesystem | Persists because the host path persists |

The lab verified that writable-layer data disappeared after recreating a container. It also verified persistence with both a named volume and a bind mount.

```bash
# Relative host path; resolved from the directory where this command is run
docker run -v ./data:/data docker-refresh:local

# Docker-managed storage, independent of a container lifecycle
docker volume create docker-refresh-data
docker run -v docker-refresh-data:/data docker-refresh:local
```

`./data:/data` is a bind mount, so its meaning depends on the command's working directory. The local `data/` directory used for this experiment is intentionally ignored by Git.

## Networking

`EXPOSE 3000` documents the port the image expects to use. It does **not** publish that port to the host. Host access requires explicit publishing:

```bash
docker run -p 3000:3000 docker-refresh:local
```

The Node server listens on `0.0.0.0:3000`, allowing it to receive traffic through the container network interface. Binding only to `127.0.0.1` would limit it to the container's own loopback interface.

`localhost` inside a container refers to that same container, not the host or another container. For container-to-container communication, the lab used a custom Docker network and Docker's internal DNS:

```bash
docker network create docker-refresh-net
docker run -d --name app --network docker-refresh-net docker-refresh:local
docker run --rm --network docker-refresh-net alpine wget -qO- http://app:3000
```

The second container resolved `app` by container name without publishing the application port to the host.

## Dockerfile mental model

The lab image is defined by the included [`Dockerfile`](Dockerfile):

```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY server.js .
EXPOSE 3000
CMD ["node", "server.js"]
```

- `FROM` selects the base image.
- `WORKDIR` sets the working directory for later instructions and the command.
- `COPY` transfers build-context files into the image.
- `EXPOSE` documents the intended container port.
- `CMD` is the default process, which becomes PID 1 unless overridden.

Building produces an image at build time; environment variables, mounts, networks, and port publishing are runtime concerns. Docker reuses cached build layers when an instruction and its relevant inputs have not changed, which makes instruction ordering meaningful.

## Commands practiced

```bash
docker ps
docker ps -a
docker logs <container>
docker exec -it <container> sh
docker inspect <container>
docker top <container>
docker stats
docker system prune
```

These commands help separate common failure layers: whether a container exists or is running, what its process logged, which process is running, how it is configured, and what resources it consumes.

## Hands-on lab summary

1. Created a Node HTTP server that listens on `0.0.0.0:3000`.
2. Built and ran a Node Alpine image with `-p 3000:3000`, then verified it with `curl`.
3. Inspected logs, processes with `docker top`, and a shell started through `docker exec`.
4. Confirmed that the container writable layer is ephemeral.
5. Verified persistence with a relative bind mount and a named volume across container recreation.
6. Connected two containers on a custom network using container-name DNS without host port publishing.
7. Removed unneeded lab containers and runtime resources after the experiments.

## Troubleshooting workflow

1. Use `docker ps -a` to determine whether the container exists, is running, or exited.
2. Read `docker logs <container>` for application startup and runtime errors.
3. Use `docker inspect <container>` to verify ports, mounts, networks, and configuration.
4. Use `docker top <container>` to inspect the running process; use `docker exec` only on a running container for an additional diagnostic process.
5. For connectivity issues, check the application bind address, `-p` mapping for host access, and the Docker network plus container name for inter-container access.

## Key takeaways

- Images are reusable artifacts; containers are their running instances.
- PID 1 governs a container's lifecycle.
- Named volumes and bind mounts both persist beyond a container, but they differ in storage ownership and management.
- `EXPOSE` documents; `-p` publishes to the host.
- Containers on the same Docker network can reach each other by name, while each container's `localhost` remains private to itself.
- Docker Compose expresses the same multi-container configuration declaratively; it does not change these underlying models.
