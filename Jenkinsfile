node {
    def app

    stage('Clone repository') {

        checkout scm
    }

    stage('Build image') {

        app = docker.build("mminichino/sample-app")
    }

    stage('Test image') {

      dir ('test') {
        sh './run_tests.sh'
      }

    }

    stage('Push image') {
        docker.withRegistry('https://registry.hub.docker.com', 'docker-hub-credentials') {
            app.push("2.4.${env.BUILD_NUMBER}")
            app.push("latest")
        }
    }
}