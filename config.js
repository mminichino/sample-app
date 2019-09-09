module.exports = {
    jwtSecret: 'E4F07725A782AB9C15D5444FB6A940517BC10F5F776A5E1122AA82092581897A',
    sessionSecret: '743777217A25432A462D4A614E645267556A586E3272357538782F413F442847',
    mysqlHost: process.env.MYSQL_HOST || "127.0.0.1",
    mysqlUser: process.env.MYSQL_USER || "sampleapp",
    mysqlPassword: process.env.MYSQL_PASSWORD || "password",
    mysqlDatabase: process.env.MYSQL_DATABASE || "sampleapp",
    redisHost: process.env.REDIS_HOST || "127.0.0.1",
    redisPort: process.env.REDIS_PORT || 6379,
    clusterMode: process.env.CLUSTERMODE || 0
};