# Kubeconfig Setup Guide

If you see "Kubeconfig not found at: /Users/jw/.kube/config", you need to create a kubeconfig file to connect to your Kubernetes cluster.

## Option 1: Managed Cloud Cluster (GKE, EKS, AKS)

- **Google GKE:**

  ```sh
  gcloud container clusters get-credentials <CLUSTER_NAME> --region <REGION> --project <PROJECT_ID>
  ```

- **AWS EKS:**

  ```sh
  aws eks update-kubeconfig --region <REGION> --name <CLUSTER_NAME>
  ```

- **Azure AKS:**

  ```sh
  az aks get-credentials --resource-group <RESOURCE_GROUP> --name <CLUSTER_NAME>
  ```

## Option 2: Kubeadm or Local Cluster

- If you have a kubeconfig file from your admin, copy it to `/Users/jw/.kube/config`.
- Or, if you have access to the cluster node:

  ```sh
  mkdir -p ~/.kube
  sudo cp /etc/kubernetes/admin.conf ~/.kube/config
  sudo chown $(id -u):$(id -g) ~/.kube/config
  ```

## Option 3: Manual Template

If you have API server address, CA, and user credentials, fill in the following template and save as `/Users/jw/.kube/config`:

```yaml
apiVersion: v1
kind: Config
clusters:
  - cluster:
      server: https://<API_SERVER>
      certificate-authority-data: <BASE64_CA>
    name: my-cluster
contexts:
  - context:
      cluster: my-cluster
      user: my-user
    name: my-context
current-context: my-context
users:
  - name: my-user
    user:
      token: <BEARER_TOKEN>
```

## Test

After setup, run:

```sh
kubectl get nodes
```

If you see a node list, your kubeconfig is working!
