# Infrastructure as Code (IaC) & Production Operations

This directory contains the configurations and scripts required to deploy, manage, and monitor the Market Scout Agent platform in a production environment.

## Directory Structure

- `docker/`: Specialized Dockerfiles for each service.
- `k8s/`: Kubernetes manifests and Helm charts for orchestration.
- `monitoring/`: Prometheus, Grafana, and Alertmanager configurations.
- `ci-cd/`: Workflows and pipelines for automated testing and deployment.
- `terraform/`: Infrastructure provisioning for cloud providers (AWS/GCP/Azure).
- `scripts/`: Production-specific operations scripts (backups, recovery).

## Getting Started

Refer to the service-specific documentation within each subdirectory for setup and deployment instructions.
