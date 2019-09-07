node {

    stage('Clone repository') {

        checkout scm
    }

    stage('Build image') {

        def app = docker.build("mminichino/sample-app:2.5.${env.BUILD_NUMBER}")
        app.push()
        app.push('latest')

    }

}