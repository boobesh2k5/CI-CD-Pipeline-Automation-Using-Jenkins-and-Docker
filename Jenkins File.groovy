pipeline {
    agent any

    stages {

        stage('Clone Repository') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/boobesh2k5/CI-CD-Pipeline-Automation-Using-Jenkins-and-Docker.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t nginx-app .'
            }
        }

        stage('Deploy Application') {
            steps {
                sh '''
                docker rm -f nginx-container || true
                docker run -d --name nginx-container -p 8081:80 nginx-app
                '''
            }
        }
    }
}