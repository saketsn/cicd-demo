pipeline {
    agent any

    environment {
        APP_NAME = "cicd-demo"
        IMAGE_NAME = "cicd-demo-image"
        CONTAINER_NAME = "cicd-demo-container"
        PORT = "3000"
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Pulling latest code from GitHub...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing Node.js dependencies...'
                sh 'npm install'
            }
        }

        stage('Run Tests') {
            steps {
                echo 'Running test cases...'
                sh 'npm test'
            }
        }

        stage('Build Docker Image') {
            steps {
                echo 'Building Docker image...'
                sh "docker build -t ${IMAGE_NAME} ."
            }
        }

        stage('Deploy Container') {
            steps {
                echo 'Deploying container...'
                sh "docker stop ${CONTAINER_NAME} || true"
                sh "docker rm ${CONTAINER_NAME} || true"
                sh "docker run -d --name ${CONTAINER_NAME} -p ${PORT}:${PORT} ${IMAGE_NAME}"
            }
        }

    }

    post {
        success {
            echo 'Pipeline completed successfully! App is deployed.'
        }
        failure {
            echo 'Pipeline failed. Check the logs above.'
        }
    }
}