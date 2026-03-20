# CI/CD Pipeline Project — Node.js + Jenkins + Docker + AWS EC2


A fully automated CI/CD pipeline that deploys a Node.js application using GitHub, Jenkins, Docker, and AWS EC2. Every push to the `main` branch automatically triggers the pipeline — running tests, building a Docker image, and deploying a fresh container to EC2 with zero manual steps.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Pipeline Stages](#pipeline-stages)
- [Prerequisites](#prerequisites)
- [Setup Guide](#setup-guide)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Launch AWS EC2 Instance](#2-launch-aws-ec2-instance)
  - [3. Install Jenkins on EC2](#3-install-jenkins-on-ec2)
  - [4. Install Docker on EC2](#4-install-docker-on-ec2)
  - [5. Install Node.js on EC2](#5-install-nodejs-on-ec2)
  - [6. Create Jenkins Pipeline Job](#6-create-jenkins-pipeline-job)
  - [7. Configure GitHub Webhook](#7-configure-github-webhook)
- [How It Works](#how-it-works)
- [Test Cases](#test-cases)
- [Dockerfile Explained](#dockerfile-explained)
- [Jenkinsfile Explained](#jenkinsfile-explained)
- [Build History](#build-history)
- [Key Concepts Learned](#key-concepts-learned)
- [Interview Q&A](#interview-qa)
- [Future Improvements](#future-improvements)

---

## Project Overview

This project demonstrates a complete DevOps workflow — from writing code to automated deployment on a cloud server. The goal was to eliminate manual deployment steps by building a pipeline that:

- Automatically detects every code push via GitHub webhooks
- Runs automated tests as a quality gate
- Containerizes the application using Docker
- Deploys a fresh container to AWS EC2 on every successful build

The pipeline also demonstrates CI's failure handling — during development, a test failure on build #2 correctly blocked a bad deployment, and the app was only deployed after the fix was pushed (build #3).

---

## Architecture

```
Developer
    │
    │  git push origin main
    ▼
GitHub Repository
    │
    │  Webhook (HTTP POST) to Jenkins
    ▼
Jenkins (AWS EC2 :8080)
    │
    ├── Stage 1: Checkout code from GitHub
    ├── Stage 2: npm install (install dependencies)
    ├── Stage 3: npm test (run automated tests)
    ├── Stage 4: docker build (build image)
    └── Stage 5: docker run (deploy container)
                    │
                    ▼
            Node.js App running in Docker Container
            AWS EC2 (port 3000)
                    │
                    ▼
            http://<EC2-PUBLIC-IP>:3000
            "Hello from CI/CD Pipeline!"
```

---

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 18.x | Application runtime |
| Express | 4.x | Web framework |
| Mocha | Latest | Test runner |
| Supertest | Latest | HTTP endpoint testing |
| Git | 2.34.1 | Version control |
| GitHub | - | Remote repository + webhook source |
| Jenkins | 2.541.3 | CI/CD automation server |
| Docker | 28.2.2 | Containerization |
| AWS EC2 | t2.micro | Cloud server (Ubuntu 22.04 LTS) |
| Java | OpenJDK 17 | Jenkins runtime dependency |

---

## Project Structure

```
cicd-demo/
├── app.js                  # Express web server
├── Dockerfile              # Docker image build instructions
├── Jenkinsfile             # CI/CD pipeline definition
├── package.json            # Node.js project config + scripts
├── package-lock.json       # Locked dependency versions
├── .gitignore              # Files excluded from git
├── .dockerignore           # Files excluded from Docker build
└── test/
    └── app.test.js         # Automated test cases (Mocha + Supertest)
```

---

## Pipeline Stages

The pipeline is defined as code in the `Jenkinsfile` and consists of 5 stages:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Checkout   │───▶│   Install   │───▶│    Test     │───▶│Docker Build │───▶│   Deploy    │
│             │    │Dependencies │    │             │    │             │    │             │
│ git pull    │    │ npm install │    │  npm test   │    │docker build │    │ docker run  │
│from GitHub  │    │             │    │  2 passing  │    │  -t image   │    │ -p 3000:3000│
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                            │
                                    If tests FAIL:
                                    Pipeline stops here
                                    Docker + Deploy skipped
                                    App NOT deployed ✅
```

---

## Prerequisites

Before setting up this project you will need:

- An AWS account (free tier works)
- A GitHub account
- Git installed on your local machine
- Node.js 18.x installed locally
- Basic familiarity with terminal/command line

---

## Setup Guide

### 1. Clone the Repository

```bash
git clone https://github.com/saketsn/cicd-demo.git
cd cicd-demo
npm install
npm test
```

### 2. Launch AWS EC2 Instance

- AMI: **Ubuntu Server 22.04 LTS**
- Instance type: **t2.micro** (free tier)
- Create a key pair (.pem file) — download and save securely
- Configure Security Group inbound rules:

| Port | Protocol | Source | Purpose |
|---|---|---|---|
| 22 | TCP | My IP | SSH access |
| 8080 | TCP | 0.0.0.0/0 | Jenkins UI |
| 3000 | TCP | 0.0.0.0/0 | Node.js app |

SSH into the instance:

```bash
# Fix key permissions (Windows)
icacls "path\to\key.pem" /inheritance:r /grant:r "%USERNAME%:R"

# Connect
ssh -i "path/to/key.pem" ubuntu@<EC2-PUBLIC-IP>
```

### 3. Install Jenkins on EC2

```bash
# Install Java (Jenkins dependency)
sudo apt update
sudo apt install -y fontconfig openjdk-17-jre

# Add Jenkins repository and key
sudo gpg --keyserver keyserver.ubuntu.com --recv-keys 7198F4B714ABFC68
sudo gpg --export 7198F4B714ABFC68 | sudo tee /usr/share/keyrings/jenkins-keyring.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.gpg] https://pkg.jenkins.io/debian-stable binary/" | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null

# Install Jenkins
sudo apt update
sudo apt install -y jenkins

# Start and enable Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins
```

Access Jenkins at `http://<EC2-PUBLIC-IP>:8080`

Get the initial admin password:

```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

Unlock Jenkins → Install suggested plugins → Create admin user.

### 4. Install Docker on EC2

```bash
sudo apt install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker

# Give Jenkins permission to run Docker commands
sudo usermod -aG docker jenkins
sudo usermod -aG docker ubuntu

# Restart Jenkins to apply group changes
sudo systemctl restart jenkins
```

### 5. Install Node.js on EC2

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version   # v18.x.x
npm --version    # 10.x.x
```

### 6. Create Jenkins Pipeline Job

1. Open Jenkins → **New Item**
2. Name: `cicd-demo-pipeline` → Select **Pipeline** → OK
3. Under **General**: check **GitHub project**, enter repo URL
4. Under **Build Triggers**: check **GitHub hook trigger for GITScm polling**
5. Under **Pipeline**:
   - Definition: `Pipeline script from SCM`
   - SCM: `Git`
   - Repository URL: `https://github.com/saketsn/cicd-demo.git`
   - Branch Specifier: `*/main`
   - Script Path: `Jenkinsfile`
6. Click **Save**

### 7. Configure GitHub Webhook

1. Go to your GitHub repo → **Settings** → **Webhooks** → **Add webhook**
2. Fill in:
   ```
   Payload URL:  http://<EC2-PUBLIC-IP>:8080/github-webhook/
   Content type: application/json
   Events:       Just the push event
   Active:       ✓
   ```
3. Click **Add webhook**

Now every `git push` to `main` automatically triggers the Jenkins pipeline.

---

## How It Works

### Normal flow (tests pass)

```
git push origin main
    → GitHub fires webhook to Jenkins
    → Jenkins pulls latest code
    → npm install (install all dependencies)
    → npm test (both tests pass ✅)
    → docker build -t cicd-demo-image .
    → docker stop cicd-demo-container (stop old)
    → docker rm cicd-demo-container (remove old)
    → docker run -d -p 3000:3000 cicd-demo-image (deploy new)
    → App live at http://<EC2-IP>:3000
```

### Failure flow (tests fail)

```
git push origin main
    → GitHub fires webhook to Jenkins
    → Jenkins pulls latest code
    → npm install ✅
    → npm test ❌ (test fails)
    → Pipeline STOPS immediately
    → Docker build SKIPPED
    → Deploy SKIPPED
    → Broken code never reaches production ✅
```

---

## Test Cases

Tests are written using **Mocha** (test runner) and **Supertest** (HTTP testing):

```javascript
// test/app.test.js

describe('GET /', () => {

  it('should return 200 status code', (done) => {
    request(app)
      .get('/')
      .expect(200, done);
  });

  it('should return correct message', (done) => {
    request(app)
      .get('/')
      .expect('Hello from CI/CD Pipeline! - Automated Deploy v2', done);
  });

});
```

Run tests locally:

```bash
npm test
```

Expected output:

```
  GET /
    ✔ should return 200 status code
    ✔ should return correct message

  2 passing (45ms)
```

---

## Dockerfile Explained

```dockerfile
# Base image — Node.js 18 on Alpine Linux (lightweight, only 5MB base)
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files first (enables Docker layer caching for npm install)
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy application source code
COPY . .

# Document the port the app listens on
EXPOSE 3000

# Command to start the app when container runs
CMD ["node", "app.js"]
```

**Why copy `package.json` before app code?**
Docker caches each layer. If only the app code changes (not dependencies), Docker reuses the cached `npm install` layer — making rebuilds significantly faster.

**Why `node:18-alpine`?**
Alpine Linux is a minimal distro (~5MB) vs the full Node image (~900MB). Smaller image = faster builds, faster transfers, smaller attack surface.

---

## Jenkinsfile Explained

```groovy
pipeline {
    agent any  // Run on any available Jenkins executor

    environment {
        // Variables used across all stages
        IMAGE_NAME     = "cicd-demo-image"
        CONTAINER_NAME = "cicd-demo-container"
        PORT           = "3000"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm  // Pull latest code from GitHub
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'  // Install all packages including devDependencies
            }
        }

        stage('Run Tests') {
            steps {
                sh 'npm test'  // Run mocha tests — pipeline stops if any fail
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${IMAGE_NAME} ."
            }
        }

        stage('Deploy Container') {
            steps {
                sh "docker stop ${CONTAINER_NAME} || true"   // Stop old container
                sh "docker rm ${CONTAINER_NAME} || true"     // Remove old container
                sh "docker run -d --name ${CONTAINER_NAME} -p ${PORT}:${PORT} ${IMAGE_NAME}"
            }
        }
    }

    post {
        success { echo 'Pipeline completed successfully! App is deployed.' }
        failure { echo 'Pipeline failed. Check the logs above.' }
    }
}
```

**Why `|| true` on docker stop/rm?**
On the very first deployment, there is no existing container to stop or remove. Without `|| true`, these commands would fail and abort the pipeline. `|| true` means "if this command fails, treat it as success and continue."

---

## Build History

| Build | Trigger | Result | Notes |
|---|---|---|---|
| #1 | Manual (Build Now) | ✅ SUCCESS | First successful end-to-end pipeline run |
| #2 | GitHub webhook (git push) | ❌ FAILURE | CI correctly caught test failure — app message updated but test not updated |
| #3 | GitHub webhook (git push) | ✅ SUCCESS | Fixed test case — auto-deployed successfully |

Build #2 failing is a feature, not a bug. It proved the pipeline's quality gate works — bad code was blocked from reaching production automatically.

---

## Key Concepts Learned

**CI (Continuous Integration)**
Automatically build and test code on every push. Catch bugs early before they pile up.

**CD (Continuous Deployment)**
Automatically deploy tested code to the server. No manual deployment steps.

**Pipeline as Code**
The entire pipeline is defined in a `Jenkinsfile` that lives in the repository. Changes to the pipeline are version-controlled just like application code.

**Docker containerization**
The app runs in an isolated container with all its dependencies bundled. Eliminates "works on my machine" problems. Same container runs identically on any server.

**Webhooks**
Event-driven triggers — GitHub sends an HTTP POST to Jenkins the moment code is pushed. More efficient than polling.

**Layer caching**
Docker caches each image layer. Unchanged layers (like npm install) are reused on rebuild, making subsequent builds much faster.

---



## Future Improvements

- [ ] Add Docker Hub integration to push images to a registry
- [ ] Add staging environment before production deployment
- [ ] Set up Slack/email notifications on pipeline failure
- [ ] Add AWS Elastic IP to avoid IP change on EC2 restart
- [ ] Implement multi-branch pipeline for feature branch testing
- [ ] Add code coverage reporting to test stage
- [ ] Use Docker Compose for multi-container setup
- [ ] Implement blue-green deployment to eliminate downtime

---

## Author

**Saket Nandan**
DevOps Intern Project — March 2026

---

## License

MIT License — feel free to use this project as a reference for your own CI/CD setup.