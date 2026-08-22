# Session 01: Linux & Networking Foundations

> **Objective:** Build a practical understanding of Linux processes, network interfaces, ports, and HTTP connectivity before moving on to Docker and Kubernetes networking.

## Contents

- [Lab environment](#lab-environment)
- [What I practiced](#what-i-practiced)
- [Core commands](#core-commands)
- [Port publishing experiment](#port-publishing-experiment)
- [Troubleshooting](#troubleshooting)
- [Key takeaways](#key-takeaways)

## Lab environment

| Component | Value |
| --- | --- |
| Host | macOS |
| Docker | 27.4.0 |
| Container image | `ubuntu:24.04` |
| Test server | Python `http.server` |

## What I practiced

- Used an Ubuntu container as a disposable Linux lab.
- Inspected processes with `ps`, interfaces with `ip addr`, and listening ports with `ss`.
- Ran a Python HTTP server and tested it using `curl`.
- Compared `localhost` and a container IP address.
- Published Docker ports from the host to a container.
- Diagnosed stopped processes and port mismatches.
- Reviewed the roles of HTTP, HTTPS, TCP, DNS, and ports.

## Core commands

### Start and access the lab

```bash
docker run -it --name devops-lab ubuntu:24.04 bash
docker start devops-lab
docker exec -it devops-lab bash
```

### Inspect processes and networking

```bash
ps aux
ip addr
ss -lntp
```

### Run and test an HTTP server

```bash
python3 -m http.server 8080
curl http://localhost:8080
```

## Port publishing experiment

The first container was created without a published port:

```bash
docker run -it --name devops-lab ubuntu:24.04 bash
```

The application was reachable inside the container, but not from the host:

```bash
# Inside the container
curl http://172.17.0.2:8080

# On the host: connection fails because no port is published
curl http://localhost:8080
```

I recreated the container with port publishing enabled:

```bash
docker run -it \
  --name devops-lab \
  -p 8080:8080 \
  ubuntu:24.04 bash
```

This made the server available from the host at `http://localhost:8080`.

I also tested a different host port:

```bash
-p 9000:8080
```

```text
Host localhost:9000  ── Docker port mapping ──>  Container :8080  ──>  Python HTTP server
```

The host port and container port do not need to be the same.

## Troubleshooting

### The application process stopped

After stopping the Python server:

```bash
kill <PID>
```

Its listening socket disappeared from `ss -lntp`, and `curl` failed. A port is available only while a process is bound to it and listening.

### Port mismatch

Given this setup:

| Layer | Port |
| --- | --- |
| Host | `9000` |
| Docker target in the container | `8080` |
| Application listener | `3000` |

The request fails because Docker forwards traffic to container port `8080`, where no application is listening.

Two valid fixes are:

```text
Host 9000 -> Container 8080 -> Application listens on 8080
Host 9000 -> Container 3000 -> Application listens on 3000
```

## Key takeaways

- A server is a running process listening on a network socket.
- `localhost` refers to the current network namespace; host and container `localhost` are different.
- `0.0.0.0` means a service listens on all available IPv4 interfaces.
- Docker port publishing connects a host port to a container port.
- Ports identify where to connect; protocols define how communication happens after the connection is established.
- `http://` and `https://` specify protocols, while ports such as `80`, `443`, `8080`, and `8443` specify destination ports.
- Successful TCP connectivity does not guarantee a valid HTTP response.
- `ps`, `ss`, `curl`, and `ip addr` help isolate whether a problem is in the process, network, port, or application layer.
