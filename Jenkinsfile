node {
    def app

    stage('Clone repository') {

        checkout scm
    }

    stage('Build image') {

        app = docker.build("mminichino/sample-app")
    }

    stage('Test image') {

        environment {
                PATH = "$PATH:/usr/local/bin"
        }

        sh 'docker-compose -f docker-compose-integration.yaml up --force-recreate --abort-on-container-exit'
        sh 'curl http://127.0.0.1:8080 > /tmp/sampleapp.curl.test'
        sh 'grep \\"Version: 2\\" /tmp/sampleapp.curl.test'
        sh 'docker-compose -f docker-compose-integration.yaml down -v'
    }

    stage('Push image') {
        docker.withRegistry('https://registry.hub.docker.com', 'docker-hub-credentials') {
            app.push("2.4.${env.BUILD_NUMBER}")
            app.push("latest")
        }
    }
}