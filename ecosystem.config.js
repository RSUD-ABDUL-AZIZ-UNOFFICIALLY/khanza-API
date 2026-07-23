module.exports = {
    apps: [{
        name: "node-simrs-api",
        script: "./index.js",
        time: true,
        instances: -1,
        exec_mode: "cluster",
        watch: true,
        env: {
            NODE_ENV: "development",
        }
    }]
}