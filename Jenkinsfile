pipeline {
  agent any
  stages {
    stage('Checkout') { steps { checkout scm } }
    stage('Node and pnpm') { steps { sh 'corepack enable && node -v && pnpm -v' } }
    stage('Nexus Auth') { steps { sh 'echo "@company:registry=$NEXUS_NPM_HOSTED" > .npmrc' } }
    stage('Install') { steps { sh 'pnpm install --frozen-lockfile' } }
    stage('Quality') { steps { sh 'pnpm lint && pnpm type-check && pnpm test' } }
    stage('Publish') { steps { sh 'pnpm publish:nexus --access restricted' } }
  }
}
